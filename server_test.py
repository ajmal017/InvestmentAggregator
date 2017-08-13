#!/usr/bin/env python

# ---------------------------------------------------------------------------- #
# Developer: Andrew Kirfman                                                    #
# Project: CSCE-470 Project Task #3                                            #
#                                                                              #
# File: ./server_test.py                                                       #
# ---------------------------------------------------------------------------- #

# ---------------------------------------------------------------------------- #
# Standard Library Includes                                                    #
# ---------------------------------------------------------------------------- #

import tornado.ioloop
import tornado.web
import tornado.websocket
import tornado.autoreload
from tornado.options import define, options, parse_command_line
import os
import sys
import logging
import copy
import requests
import MySQLdb
import atexit
import json
from yahoo_finance import Share
from bs4 import BeautifulSoup



sys.path.append(".")
sys.path.append("./AccessoryLibraries/BollingerBandStrategy/")
sys.path.append("./AccessoryLibraries/YahooFinanceHistoricalDataExtractor/")
sys.path.append("./AccessoryLibraries/HTTP_Request_Randomizer/")
sys.path.append("./AccessoryLibraries/RobinhoodPython/")

from dividend_stripper import strip_dividends
from bollinger_bands import BollingerBandStrategy
from yahoo_finance_historical_data_extractor import YFHistoricalDataExtract
from http_request_randomizer.requests.proxy.requestProxy import RequestProxy
from robinhood import RobinhoodInstance, GET_ALL

# ---------------------------------------------------------------------------- #
# Global Variables                                                             #
# ---------------------------------------------------------------------------- #

TICKER_FILE = "stock_file.txt"
TEMP_DIR = "/tmp/InvestmentAggregator"
YAHOO_FINANCE_HISTORICAL_OBJECT = None

ROBINHOOD_INSTANCE = None

"""

# Current Database Parameters
DB_HOST="127.0.0.1"
DB_USER="root"
DB_PASSWD="drew11"
DB_PRIMARY_DATABASE=""

# Maintain a global object for interacting with the database
current_stock_database = None

# Maintain a global object for interacting with the list of publicly traded stocks
current_stock_list = None

# Email address for the server admin
ADMIN_EMAIL = "andrew.kirfman@tamu.edu"

"""

# ---------------------------------------------------------------------------- #
# Command Line Arguments                                                       #
# ---------------------------------------------------------------------------- #

# Import Command Line Arguments
define("port", default=8888, help="Run on the given port", type=int)
define("logger", default="", help="Define the current logging level", type=str)

# ---------------------------------------------------------------------------- #
# Console/File Logger                                                          #
# ---------------------------------------------------------------------------- #

print_logger = logging.getLogger(__name__)

# Set this variable if you want to use the req_proxy library
use_proxy = False

# I'm pretty sure that Python will get mad if I do not forward declare this variable
req_proxy = None

if use_proxy is True:
    req_proxy = RequestProxy()


def update_description_oneoff(ticker):
    if use_proxy is True:
        global req_proxy

    print "Executing oneoff description grab from reuters.com"

    desc_link = "http://www.reuters.com/finance/stocks/companyProfile?symbol="\
        + str(ticker) + "&rpc=66"

    request = None

    while request is None:
        if use_proxy is True:
            request = req_proxy.generate_proxied_request(desc_link)
        else:
            request = requests.get(desc_link)

        if request is not None:
            if request.status_code != 200:
                request = None

    request_soup = BeautifulSoup(request.text, "html5lib")

    if len(request_soup.find_all("div", {"class" : "moduleBody"})) < 2:
        return "<div class=\"moduleBody\">No Description Found</div>"

    company_description = request_soup.find_all("div", {"class" : "moduleBody"})[1]

    # Sometimes, an extra div sticks around.  Just get rid of it if it is there
    bad_parts = company_description.find_all("div")

    if len(bad_parts) > 0:
        company_description = str(company_description).replace(str(bad_parts[0]), "")

    return str(company_description)


def get_company_title(ticker):
    if use_proxy is True:
        global req_proxy

    print "Executing oneoff title grab from reuters.com"

    try:
        desc_link = "http://www.reuters.com/finance/stocks/companyProfile?symbol="\
            + str(ticker) + "&rpc=66"

        request = None

        while True:
            if use_proxy is True:
                request = req_proxy.generate_proxied_request(desc_link)
            else:
                request = requests.get(desc_link)

            if request is not None:
                if request.status_code == 200:
                    break

        request_soup = BeautifulSoup(request.text, "html5lib")

        company_name = request_soup.find_all("div", {"id" : "sectionTitle"})[0].text.strip().split(":")[1]

        return company_name
    except Exception:
        return "(%s) Name Not Found" % ticker

def validate_ticker(ticker):
        try:
            test = Share(ticker)

            if test.get_price() is None:
                return False
        except NameError:
            return False
        
        return True

# ---------------------------------------------------------------------------- #
# Static Handlers                                                              #
# ---------------------------------------------------------------------------- #

class MainScreenHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        self.render("./static/html/main_screen.html")

class TickerHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        self.render("./static/html/ticker_screen.html")

class StrategiesHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        self.render("./static/html/investing_strategies.html")

class TipsHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        self.render("./static/html/investing_tips.html")

class RobinhoodLogin(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        self.render("./static/html/robinhood_login.html")

# ---------------------------------------------------------------------------- #
# Websocket Handlers                                                           #
# ---------------------------------------------------------------------------- #

class MainWsHandler(tornado.websocket.WebSocketHandler):
    def check_origin(self, _):
        return True

    def open(self, _):
        pass

    def on_message(self, message):
        print_logger.debug("Message: %s" % str(message))

        if "ValidateTicker" in message:
            message = message.split(":")

            if len(message) != 2:
                print_logger.error("Malformed ticker validation request")
                self.write_message("ValidationFailed:Malformed")
                return

            ticker = message[1]

            if validate_ticker(ticker):
                self.write_message("ValidationSucceeded:%s" % ticker)
                print_logger.debug("Ticker was valid")
            else:
                self.write_message("ValidationFailed:%s" % ticker)
                print_logger.debug("Ticker was bad")

            return

        elif "CheckRobinhoodLogin" in message:
            if ROBINHOOD_INSTANCE.is_logged_in() is True:
                self.write_message("RobinhoodLoggedIn:%s" % str(ROBINHOOD_INSTANCE.username))
            else:
                self.write_message("RobinhoodNotLoggedIn")



class TickerWsHandler(tornado.websocket.WebSocketHandler):
    def check_origin(self, _):
        return True

    def open(self, _):
        pass

    def on_message(self, message):
        print_logger.debug("Received message: %s" % (message))

        if "ValidateTicker" in message:
            message = message.split(":")

            if len(message) != 2:
                print_logger.error("Malformed ticker validation request")
                self.write_message("ValidationFailed:Malformed")
                return

            ticker = message[1]

            if validate_ticker(ticker):
                self.write_message("ValidationSucceeded:%s" % ticker)
                print_logger.debug("Ticker was valid")
            else:
                self.write_message("ValidationFailed:%s" % ticker)
                print_logger.debug("Ticker was bad")

            return

        elif "GetCompanyName" in message:
            print_logger.debug("You got here")
            message = message.split(":")
            company_ticker = message[1]
            company_name = get_company_title(company_ticker)

            self.write_message("CompanyName:%s" % company_name)

        elif "GetStockData" in message:
            message = message.split(":")

            if len(message) != 2:
                print_logger.error("Malformed Message from Client")
                return

            ticker = message[1]

            # Get ticker information
            share_data = Share(ticker)
            price = share_data.get_price()
            percent_change = share_data.get_change()
            previous_close = share_data.get_prev_close()
            open_price = share_data.get_open()
            volume = share_data.get_volume()
            pe_ratio = share_data.get_price_earnings_ratio()
            peg_ratio = share_data.get_price_earnings_growth_ratio()
            market_cap = share_data.get_market_cap()
            book_value = share_data.get_price_book()
            average_volume = share_data.get_avg_daily_volume()
            dividend_share = share_data.get_dividend_share()
            dividend_yield = share_data.get_dividend_yield()
            earnings_per_share = share_data.get_earnings_share()
            ebitda = share_data.get_ebitda()
            fifty_day_ma = share_data.get_50day_moving_avg()
            days_high = share_data.get_days_high()
            days_low = share_data.get_days_low()
            year_high = share_data.get_year_high()
            year_low = share_data.get_year_low()
            two_hundred_day_ma = share_data.get_200day_moving_avg()

            # Build a string to send to the server containing the stock data
            share_string = "price:" + str(price) + "|"\
                         + "percentChange:" + str(percent_change) + "|"\
                         + "previousClose:" + str(previous_close) + "|"\
                         + "openPrice:" + str(open_price) + "|"\
                         + "volume:" + str(volume) + "|"\
                         + "peRatio:" + str(pe_ratio) + "|"\
                         + "pegRatio:" + str(peg_ratio) + "|"\
                         + "marketCap:" + str(market_cap) + "|"\
                         + "bookValue:" + str(book_value) + "|"\
                         + "averageVolume:" + str(average_volume) + "|"\
                         + "dividendShare:" + str(dividend_share) + "|"\
                         + "dividendYield:" + str(dividend_yield) + "|"\
                         + "earningsPerShare:" + str(earnings_per_share) + "|"\
                         + "ebitda:" + str(ebitda) + "|"\
                         + "50DayMa:" + str(fifty_day_ma) + "|"\
                         + "daysHigh:" + str(days_high) + "|"\
                         + "daysLow:" + str(days_low) + "|"\
                         + "yearHigh:" + str(year_high) + "|"\
                         + "yearLow:" + str(year_low) + "|"\
                         + "200DayMa:" + str(two_hundred_day_ma) + "|"

            self.write_message("StockData;%s" % (share_string))
            print_logger.debug("Sending Message: StockData;%s" % (share_string))

        elif "GetCompanyDesc" in message:
            message = message.split(":")

            if len(message) != 2:
                print_logger.error("Malformed Message from Client")
                return

            ticker = message[1]

            description = update_description_oneoff(ticker)

            self.write_message("CompanyDescription:%s" % str(description))

        elif "GetCompanyDividend" in message and "Record" not in message:
            message = message.split(":")

            if len(message) != 2:
                print_logger.error("Malformed Message from Client")
                return

            ticker = message[1]

            # Grab the dividend data from dividata.com
            dividend_url = "https://dividata.com/stock/%s/dividend" % ticker

            # This should potentially be a
            dividend_data = requests.get(dividend_url)
            dividend_soup = BeautifulSoup(dividend_data.text, 'html5lib')

            if len(dividend_soup.find_all("table")) > 0:
                dividend_soup = dividend_soup.find_all("table")[0]
            else:
                dividend_soup = "<h3>No dividend history found.</h3>"

            # Send this div up to the server
            self.write_message("DividendHistoryData:" + str(dividend_soup))

        elif "GetCompanyDividendRecord" in message:
            message = message.split(":")

            if len(message) != 2:
                print_logger.error("Malformed Message from Client")
                return

            ticker = message[1]

            # Get the dividend record html for the table and send it up
            #dividend_record = strip_dividends(ticker, req_proxy)

            #print_logger.debug("Writing message: " + str(dividend_record))
            #self.write_message("DividendRecord:" + str(dividend_record))

        elif "GetBollinger" in message:
            message = message.split(":")

            if len(message) != 2:
                print_logger.error("Malformed Message from Client")
                return

            ticker = message[1]

            # Switch into the tmp directory
            old_dir = os.getcwd()
            os.chdir(TEMP_DIR)

            # Update the historical data for the ticker symbol
            YAHOO_FINANCE_HISTORICAL_OBJECT.read_ticker_historical(ticker)

            bands = BollingerBandStrategy(data_storage_dir="%s/historical_stock_data" % TEMP_DIR\
                    , ticker_file="%s/stock_list.txt" % TEMP_DIR, filtered_ticker_file=\
                    "%s/filtered_stock_list.txt" % TEMP_DIR)

            # Save the graph so that we can show it on the website
            bands.save_stock_chart(ticker, "%s" % TEMP_DIR)

            # Also let the server know that we found an answer
            result = bands.test_ticker(ticker)

            if result is not None:
                print_logger.debug("BB:GoodCandidate")
                self.write_message("BB:GoodCandidate")
            else:
                print_logger.debug("BB:BadCandidate")
                self.write_message("BB:BadCandidate")
        elif "CheckRobinhoodLogin" in message:
            print "HELLO WORLD!!! HELLO WORLD!!! HELLO WORLD!!!%s" % ROBINHOOD_INSTANCE
            if ROBINHOOD_INSTANCE.is_logged_in() is True:
                self.write_message("RobinhoodLoggedIn:%s" % ROBINHOOD_INSTANCE.username)
            else:
                self.write_message("RobinhoodNotLoggedIn")
                
        elif "GetPosition" in message:

            ticker = message.replace("GetPosition:", "")

            account_positions = ROBINHOOD_INSTANCE.get_position_history(active=True)
            user_owns_stock = False
            position_string = ""
            for position in account_positions:
                
                # Get data about the position, including current price.  
                position_data = requests.get(position["instrument"])
                position_data = json.loads(position_data._content)
                position.update(position_data)

                if position["symbol"] != ticker:
                    continue

                quote_data = requests.get(position["quote"]);
                quote_data = json.loads(quote_data._content)
                position.update(quote_data)
                
                position_string = json.dumps(position)
                user_owns_stock = True
                
            if user_owns_stock is True:
                self.write_message("Position:%s" % position_string)
            else:
                self.write_message("Position:None")

            

class RobinhoodWsHandler(tornado.websocket.WebSocketHandler):
    def check_origin(self, _):
        return True

    def open(self):
        pass

    def on_message(self, message):
        print_logger.debug("Message: %s" % str(message))
        print "Message: %s" % (message)

        if "ValidateTicker" in message:
            message = message.split(":")

            if len(message) != 2:
                print_logger.error("Malformed ticker validation request")
                self.write_message("ValidationFailed:Malformed")
                return

            ticker = message[1]

            # The file I have stored didn't end up being a good validation
            # option as it does not contain a complete list of all
            # securities.  I have to acquire the data from yahoo
            # finance anyway, so just use that.  The Share function
            # call will throw a NameError exception if the ticker doesn't exist
            # isValid = current_stock_list.is_valid_stock(ticker)

            isValid = True
            try:
                test = Share(str(ticker))

                if test.get_price() is None:
                    isValid = False
            except NameError:
                isValid = False

            if isValid:
                self.write_message("ValidationSucceeded:%s" % ticker)
                print_logger.debug("Ticker was valid")
            else:
                self.write_message("ValidationFailed:%s" % ticker)
                print_logger.debug("Ticker was bad")

            return

        elif "Login:" in message and "CheckRobinhood" not in message:
            message = message.split(":")

            if len(message) != 3:
                print_logger.debug("Malformed login message from client")
                self.write_message("LoginFailed")

            username = message[1]
            password = message[2]

            ROBINHOOD_INSTANCE.login(username, password)

            if ROBINHOOD_INSTANCE.is_logged_in() is True:
                self.write_message("LoginSucceeded")
            else:
                self.write_message("LoginFailed")

        elif "CheckRobinhoodLogin" in message:
            if ROBINHOOD_INSTANCE.is_logged_in() is True:
                self.write_message("RobinhoodLoggedIn:%s" % ROBINHOOD_INSTANCE.username)
                
                # User Data
                user_data = ROBINHOOD_INSTANCE.get_user_data(GET_ALL)
                user_data = json.dumps(user_data)
                self.write_message("UserData:%s" % user_data)
                
                # Basic User Info
                basic_user_info = ROBINHOOD_INSTANCE.get_basic_user_info(GET_ALL)
                basic_user_info = json.dumps(basic_user_info)
                self.write_message("BasicUserInfo:%s" % basic_user_info)
                
                # Positions
                account_positions = ROBINHOOD_INSTANCE.get_position_history(active=True)
                account_string = ""
                for position in account_positions:
                    # Get data about the position, including current price.  
                    position_data = requests.get(position["instrument"])
                    position_data = json.loads(position_data._content)
                    position.update(position_data)

                    quote_data = requests.get(position["quote"]);
                    quote_data = json.loads(quote_data._content)
                    position.update(quote_data)
                    
                    account_string = account_string + json.dumps(position) + ";;;"
                    
                account_string = account_string[:-3]
                self.write_message("CurrentPositions:%s" % account_string)
                
                # Account Data
                account_data = ROBINHOOD_INSTANCE.get_account_data("all")
                account_data = json.dumps(account_data)
                self.write_message("AccountData:%s" % account_data)
            else:
                self.write_message("RobinhoodNotLoggedIn")

# ---------------------------------------------------------------------------- #
# Master Handler List                                                          #
# ---------------------------------------------------------------------------- #

settings = {}
handlers = [
    (r'/', MainScreenHandler),
    (r'/ws_main(.*)', MainWsHandler),
    (r'/ticker', TickerHandler),
    (r'/ws_ticker(.*)', TickerWsHandler),
    (r'/robinhood_login', RobinhoodLogin),
    (r'/ws_robinhood_login', RobinhoodWsHandler),
    (r'/investing_tips', TipsHandler),
    (r'/investing_strategies', StrategiesHandler),
    (r'/static/(.*)', tornado.web.StaticFileHandler, {'path' : os.path.join(os.getcwd(), 'static')}),
    (r'/(favicon\.ico)', tornado.web.StaticFileHandler, {"path" : os.path.join(os.getcwd(), "")}),
    (r'/tmp/(.*)', tornado.web.StaticFileHandler, {'path' : os.path.join(TEMP_DIR, "")})
    ]

# ---------------------------------------------------------------------------- #
# Initialization Commands                                                      #
# ---------------------------------------------------------------------------- #

app = tornado.web.Application(handlers, **settings)


def clean_up_tmp_directory():
    """
    This function should be called upon program termination.  Its purpose is to
    delete the temp directory pointed to by TEMP_DIR.
    """

    os.system("rm -rf %s" % TEMP_DIR)

if __name__ == '__main__':
    #update_descriptions()

    parse_command_line()
    app.listen(options.port)

    # ------------------------------------------------------------------------ #
    # Directory Setup                                                          #
    # ------------------------------------------------------------------------ #


    # Wipe any old temp directory if there is one
    if os.path.exists(TEMP_DIR):
        
        #
        #
        # Uncomment this later!
        #
        #
        
        #os.system("rm -rf %s" % TEMP_DIR)
        pass

    # Try to create a tmp directory to store any and all needed temp files
    try:
        if not os.path.exists(TEMP_DIR):
            os.makedirs(TEMP_DIR)
    except Exception:
        print "Could not create folder in /tmp.  Exiting..."
        sys.exit(1)

    # Instantiate the robinhood object
    ROBINHOOD_INSTANCE = RobinhoodInstance()

    # Generate file of tickers using the robinhood API if you haven't done 
    # that already
    if not os.path.exists("%s/%s" % (TEMP_DIR, TICKER_FILE)):
        print "Creating ticker file!"

        ROBINHOOD_INSTANCE.get_all_instruments("%s/%s" % (TEMP_DIR, TICKER_FILE))

    # Create an object to deal with retrieving historical data.
    YAHOO_FINANCE_HISTORICAL_OBJECT = YFHistoricalDataExtract("%s/%s" % (TEMP_DIR, TICKER_FILE),
            data_storage_dir="%s/historical_stock_data" % TEMP_DIR)

    # Install the atexit handler which will wipe the temporary files stored in /tmp.
    atexit.register(clean_up_tmp_directory)

    print "Done with setup.  Starting server"

    tornado.autoreload.start()
    
    for dir, _, files in os.walk("./static"):
        [tornado.autoreload.watch(dir + '/' + f) for f in files if not f.startswith('.')]

    # Start the tornado server.
    tornado.ioloop.IOLoop.instance().start()
