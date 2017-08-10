/* ------------------------------------------------------------------------- */
/* Developer: Andrew Kirfman                                                 */
/* Project: Investment Aggregator                                            */
/*                                                                           */
/* File: ./static/js/ticker_screen.js                                        */
/* ------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------- */
/* Initial Variable Declarations                                             */
/* ------------------------------------------------------------------------- */

var host_parser = document.createElement('a');
host_parser.href = window.location.href;
var host_addr = host_parser.host;

// Update stock price data every 5 seconds.  You can change this if desired
var STOCK_PRICE_UPDATE_TIME = 5000

// The timer that updates the stuff must be stored in a variable so that it 
// can be cleared later.  
var stock_update_interval_timer = null;

// Extract the stock ticker from the http link
var stock_ticker = host_parser.href.split("?")[1];

/* ------------------------------------------------------------------------- */
/* Websocket Communication                                                   */
/* ------------------------------------------------------------------------- */

var socket_addr = "ws://" + host_addr + "/ws_ticker";
var ws = new WebSocket(socket_addr);

ws.onopen = function()
{  
    // Initial data grabs to build the webpage
    ws.send("CheckRobinhoodLogin");
    ws.send("GetStockData:" + String(stock_ticker));
    ws.send("GetCompanyName:" + String(stock_ticker));
    ws.send("GetCompanyDesc:" + String(stock_ticker));
    ws.send("GetCompanyDividend:" + String(stock_ticker));
    ws.send("GetCompanyDividendRecord:" + String(stock_ticker));
    ws.send("GetBollinger:" + String(stock_ticker));
    
    // Interval timer so that we keep getting the stock price data continually.  
    stock_update_interval_timer = setInterval(function() { update_current_price() }, 5000);
};

ws.onmessage = function(received_message)
{
    var message_text = received_message.data.trim();

    // If the ticker was valid, move the site a new page
    if(message_text.indexOf("ValidationSucceeded") >= 0)
    {
        validation_suceeded(message_text);
    }
    // If it was not valid, tell the user and stay here
    else if(message_text.indexOf("ValidationFailed") >= 0)
    {
        validation_failed(message_text);
    }
    else if(message_text.indexOf("CompanyName:") >= 0)
    {
        update_company_name();
    }
    else if(message_text.indexOf("StockData") >= 0)
    {
        update_stock_data(message_text);
        
        // Split off the first part of the message
        var stock_data_dict = message_text.split(";")[1].split("|");

        // Get current stock price
        var price = stock_data_dict[0].split(":")[1];
        var percent_change = stock_data_dict[1].split(":")[1];
        var previous_close = stock_data_dict[2].split(":")[1];
        var open_price = stock_data_dict[3].split(":")[1];
        var volume = stock_data_dict[4].split(":")[1];
        var pe_ratio = stock_data_dict[5].split(":")[1];
        var peg_ratio = stock_data_dict[6].split(":")[1];
        var market_cap = stock_data_dict[7].split(":")[1];
        var book_value = stock_data_dict[8].split(":")[1];
        var average_volume = stock_data_dict[9].split(":")[1];
        var dividend_share = stock_data_dict[10].split(":")[1];
        var dividend_yield = stock_data_dict[11].split(":")[1];
        var earnings_per_share = stock_data_dict[12].split(":")[1];
        var ebitda = stock_data_dict[13].split(":")[1];
        var fifty_day_ma = stock_data_dict[14].split(":")[1];
        var days_high = stock_data_dict[15].split(":")[1];
        var days_low = stock_data_dict[16].split(":")[1];
        var year_high = stock_data_dict[17].split(":")[1];
        var year_low = stock_data_dict[18].split(":")[1];
        var two_hundred_day_ma = stock_data_dict[19].split(":")[1];

        //
        // Incorporate this current stock price into the existing HTML
        //

        /* Price */ 
        document.getElementById("stock-price").innerHTML = "$" + price;
        
        /* Percent Change */
        var percent_change_box = document.getElementById("stock-percent-change");
        percent_change_box.innerHTML = percent_change;

        if(percent_change.indexOf("-") >= 0)
        {
            percent_change_box.className = "robinhood-red";
        }
        else
        {
            percent_change_box.className = "robinhood-green";
        }

        /* Previous Close Price */
        document.getElementById("stock-previous-close").innerHTML = "$" + previous_close;
        
        /* Open Price */
        document.getElementById("stock-open").innerHTML = "$" + open_price;

        /* Volume */
        document.getElementById("stock-volume").innerHTML = volume;

        // Add the p/e ratio data
        var pe_ratio_box = document.getElementById("pe-ratio");
        pe_ratio_box.innerHTML = pe_ratio_box.innerHTML + 
            "<h4 id=\"pe-ratio-box\" class=\"stock-value-text\">" + String(pe_ratio) + "</h4>";

        // Add the peg ratio data
        var peg_ratio_box = document.getElementById("peg-ratio");
        peg_ratio_box.innerHTML = peg_ratio_box.innerHTML + 
            "<h4 id=\"peg-ratio-box\" class=\"stock-value-text\">"+  String(peg_ratio) + "</h4>";

        // Add the market cap data
        var market_cap_box = document.getElementById("market-cap");
        market_cap_box.innerHTML = market_cap_box.innerHTML + 
            "<h4 id=\"market-cap-box\" class=\"stock-value-text\">" + String(market_cap) + "</h4>";

        // Add the book value data
        var book_value_box = document.getElementById("book-value");
        book_value_box.innerHTML = book_value_box.innerHTML + 
            "<h4 id=\"book-value-box\" class=\"stock-value-text\">" + String(book_value) + "</h4>";

        // Add the average volume data
        var average_volume_box = document.getElementById("average-volume");
        average_volume_box.innerHTML = average_volume_box.innerHTML + 
            "<h4 id=\"average-volume-box\" class=\"stock-value-text\">" + String(average_volume) + "</h4>";

        // Add the dividend share data
        var dividend_share_box = document.getElementById("dividend-share");
        dividend_share_box.innerHTML = dividend_share_box.innerHTML + 
            "<h4 id=\"dividend-share-box\" class=\"stock-value-text\">" + String(dividend_share) + "</h4>";

        // Add the dividend yield data
        var dividend_yield_box = document.getElementById("dividend-yield");
        dividend_yield_box.innerHTML = dividend_yield_box.innerHTML + 
            "<h4 id=\"dividend-yield-box\" class=\"stock-value-text\">" + String(dividend_yield) + "</h4>";

        // Add the earnings/share data
        var earnings_share_box = document.getElementById("earnings-share");
        earnings_share_box.innerHTML = earnings_share_box.innerHTML + 
            "<h4 id=\"earnings-share-box\" class=\"stock-value-text\">" + String(earnings_per_share) + "</h4>";

        // Add the ebitda data
        var ebitda_box = document.getElementById("ebitda");
        ebitda_box.innerHTML = ebitda_box.innerHTML + 
            "<h4 id=\"ebitda-box\" class=\"stock-value-text\">" + String(ebitda) + "</h4>";

        // Add the fifty day moving average data
        var fifty_day_ma_box = document.getElementById("50-day-ma");
        fifty_day_ma_box.innerHTML = fifty_day_ma_box.innerHTML + 
            "<h4 id=\"fifty-day-ma-box\" class=\"stock-value-text\">$" + String(fifty_day_ma) + "</h4>";
    
        // Add the days high data
        var days_high_box = document.getElementById("days-high");
        days_high_box.innerHTML = days_high_box.innerHTML + 
            "<h4 id=\"days-high-box\" class=\"stock-value-text\">$" + String(days_high) + "</h4>";

        // Add the days low data
        var days_low_box = document.getElementById("days-low");
        days_low_box.innerHTML = days_low_box.innerHTML + 
            "<h4 id=\"days-low-box\" class=\"stock-value-text\">$"  + String(days_low) + "</h4>";

        // Add the year high data
        var year_high_box = document.getElementById("year-high");
        year_high_box.innerHTML = year_high_box.innerHTML + 
            "<h4 id=\"year-high-box\" class=\"stock-value-text\">$" + String(year_high) + "</h4>";

        // Add the year low data
        var year_low_box = document.getElementById("year-low");
        year_low_box.innerHTML = year_low_box.innerHTML + 
            "<h4 id=\"year-low-box\" class=\"stock-value-text\">$" + String(year_low) + "</h4>";

        // Add the 200 day moving average data
        var two_hundred_day_ma_box = document.getElementById("200-day-ma");
        two_hundred_day_ma_box.innerHTML = two_hundred_day_ma_box.innerHTML + 
            "<h4 id=\"two-hundred-day-ma-box\" class=\"stock-value-text\">$" + String(two_hundred_day_ma) + "</h4>";
    }
    else if(message_text.indexOf("CompanyDescription") >= 0)
    {
        message_text = message_text.replace("CompanyDescription:", "");
        var description_div = document.getElementById("style-1");
        description_div.innerHTML = message_text;
    }
    else if(message_text.indexOf("DividendHistoryData") >= 0)
    {
		message_text = message_text.replace("DividendHistoryData:", "");
		var dividend_container = document.getElementById("panel-body-1");
		dividend_container.innerHTML = message_text.replace("table-hover", "").replace("table-striped", "");
	}
	else if(message_text.indexOf("DividendRecord") >= 0)
	{
		message_text = message_text.replace("DividendRecord:", "");
		var dividend_record_container = document.getElementById("panel-body-10");
		dividend_record_container.innerHTML = message_text;
	}
	else if(message_text.indexOf("BB") >= 0)
	{
		message_text = message_text.replace("BB:", "");
		var bb_image_container = document.getElementById("bb-image-container");
		bb_image_container.innerHTML = "<img src=\"/tmp/" + String(stock_ticker) + ".png\"></img>";
		
		var bb_text_container = document.getElementById("bb-recommendation-container");
		if(message_text == "GoodCandidate")
		{
			bb_text_container.innerHTML = "<h3 style = \"padding-left:1%;\">Bollinger Band history shows buy signal</h3>";
			bb_text_container.className = "stock-up-text";
		}
		else
		{
			bb_text_container.innerHTML = "<h3 style=\"padding-left:1%;\">Bollinger Band history says nothing currently</h3>";
			bb_text_container.className = "stock-down-text";
		}
	}
	else if(message_text.indexOf("Sentiment") >= 0)
	{
		message_text = message_text.replace("Sentiment:", "");
		var sentiment_container = document.getElementById("stock-sentiment");
		
		message_text = message_text.split(":");
		
		positive = message_text[0];
		negative = message_text[1];
		neutral = message_text[2];
		trump = message_text[3];
		
		var positive_articles = document.createElement("h4");
		var negative_articles = document.createElement("h4");
		var neutral_articles = document.createElement("h4");
		
		var sentiment_message = document.createElement("h4");
		
		positive_articles.style = "color:#38B395";
		positive_articles.innerHTML= "Positive Articles: " + String(positive);
		
		negative_articles.style = "color:#BC3D54";
		negative_articles.innerHTML = "Negative Articles: " + String(negative);
		
		neutral_articles.style = "color: #ffffff";
		neutral_articles.innerHTML = "Neutral Articles: " + String(neutral);
		
		if(parseInt(positive) > parseInt(negative))
		{	
			sentiment_message.style = "padding-top: 1%;color:#38B395;";
			sentiment_message.innerHTML = "Overall Stock Sentiment is Positive!";
		}
		else if(parseInt(positive) < parseInt(negative))
		{
			sentiment_message.style = "pading-top: 1%;color:#BC3D54;";
			sentiment_message.innerHTML = "Overall Stock Sentiment is Negative!";
		}
		else if(parseInt(positive) == parseInt(negative))
		{
			sentiment_message.style = "padding-top: 1%;color:#ffffff;";
			sentiment_message.innerHTML = "Overall Stock Sentiment is Neutral.";
		}
		
		sentiment_container.appendChild(positive_articles);
		sentiment_container.appendChild(negative_articles);
		sentiment_container.appendChild(neutral_articles);
		sentiment_container.appendChild(sentiment_message);
		
		// Trump O meter
		var trump_row = document.createElement("div");
		trump_row.className = "row";
		
		sentiment_container.appendChild(trump_row);
		
		var left_div = document.createElement("div");
		left_div.className = "col-md-4";
		
		var middle_div = document.createElement("div");
		middle_div.className = "col-md-4";
		
		var right_div = document.createElement("div");
		right_div.className = "col-md-4";
		
		trump_row.appendChild(left_div);
		trump_row.appendChild(middle_div);
		trump_row.appendChild(right_div);
		
		middle_div.style = "text-align: center;";
		middle_div.innerHTML = "<h3 style=\"color: #BC3D54\">Trump-O-Meter &copy;</h3>";
		
		var trump_row_2 = document.createElement("div");
		trump_row_2.className = "row";
		
		sentiment_container.appendChild(trump_row_2);
		
		// Calculate the trump percentage 
		var total_number = parseInt(positive) + parseInt(negative) + parseInt(neutral);
		var trump_percentage = parseInt(trump) / total_number;
		trump_percentage = Math.ceil(trump_percentage * 100);

		var progress_class = "progress-bar progress-bar-success";

		if(trump_percentage < 20)
		{
			progress_class = "progress-bar progress-bar-success";
		}
		else if(trump_percentage > 20 && trump_percentage < 30)
		{
			progress_class = "progress-bar progress-bar-info";
		}
		else if(trump_percentage > 30 && trump_percentage < 60)
		{
			progress_class = "progress-bar progress-bar-warning";
		}
		else
		{
			progress_class = "progress-bar progress-bar-danger";
		}
		
		var left_div = document.createElement("div");
		left_div.className = "col-md-2";
		
		var middle_div = document.createElement("div");
		middle_div.className = "col-md-8";
		
		var right_div = document.createElement("div");
		right_div.className = "col-md-2";
		
		var progress_div = document.createElement("div");
		progress_div.className = "progress";
		
		progress_div.innerHTML = "<div class=\"" + String(progress_class) + "\" role=\"progressbar\" aria-valuenow=\"" + String(trump_percentage) 
			+ "\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width:" + String(trump_percentage) + "%\"></div>";
			
		middle_div.appendChild(progress_div)
			
		trump_row_2.appendChild(left_div);
		trump_row_2.appendChild(middle_div);
		trump_row_2.appendChild(right_div);
	}
    else if(message_text.indexOf("RobinhoodLoggedIn") >= 0)
    {
        var fields = message_text.split(":");
        var username = fields[1];
    
        robinhood_container = document.getElementById("robinhood-container");
        
        robinhood_container.innerHTML = '<li><a href="/robinhood_login" '
            + 'style="color:#20CE99;">Logged Into Robinhood as: ' + String(username) 
            + '</a></li>';
            
        main_trading_container = document.getElementById("robinhood-trading-container");
        main_trading_container.style="";

        ws.send("GetPosition:" + stock_ticker);
    }
    else if(message_text.indexOf("Position") >= 0)
    {
        message_text = message_text.replace("Position:", "");
        
        position_div = document.getElementById("current-robinhood-position");
        
        if(message_text == "None")
        {
            position_div.innerHTML = "0 Shares";
            
            return;
        }
        else
        {
            current_position = JSON.parse(message_text)
            
            gain_loss = (current_position["last_trade_price"] - current_position["average_buy_price"]) * current_position["quantity"];
            gain_loss = Number((gain_loss).toFixed(2));
            gain_loss_percentage = gain_loss/(current_position["average_buy_price"] * current_position["quantity"]) * 100;
            gain_loss_percentage = Number((gain_loss_percentage).toFixed(2));
            gain_loss_sign = "";
            gain_loss_color = "";
            
            // Update the number of shares currently owned
            position_div.innerHTML = Number(current_position["quantity"]).toFixed(2) + " Shares";
            
            // Update the average buy cost
            position_container = document.getElementById("position-container");
            position_container.style = "display:inline;";
            
            average_cost = document.getElementById("position-average-cost");
            average_cost.innerHTML = "$" + current_position["average_buy_price"];
            average_cost.style = "display:inline;";
            
            // Update the total gain/loss of this position
            gain_loss_container = document.getElementById("gain-loss-container")
            gain_loss_container.style = "display:inline;";
            
            position_gain_loss = document.getElementById("position-gain-loss");
            position_gain_loss.style = "display:inline;";
            
            if(gain_loss >= 0.00)
            {
                position_gain_loss.className = "robinhood-green";
                position_gain_loss.innerHTML = " +" + gain_loss + " (+" + gain_loss_percentage + ")";
            }
            else
            {
                position_gain_loss.className = "robinhood-red";
                position_gain_loss.innerHTML = " " + gain_loss + " (" + gain_loss_percentage + ")";
            }
            
        }
    }
};


ws.onclose = function()
{  };

/* ------------------------------------------------------------------------- */
/* GoToTicker                                                                */
/* ------------------------------------------------------------------------- */

function GoToTicker()
{
    var ticker_name = document.getElementById("ticker-text").value.trim().toUpperCase();

    ws.send("ValidateTicker:" + String(ticker_name));
}



/* ------------------------------------------------------------------------- */
/* ExecuteQuery                                                              */
/* ------------------------------------------------------------------------- */

function ExecuteQuery()
{
	var query_div = document.getElementById("search");
	
	ws.send("ExecuteQuery:" + String(query_div.value.trim()));
}

function cancel_order_entry()
{
    parent = document.getElementById("robinhood-trading-container");
    child = document.getElementById("order-div");
    
    parent.removeChild(child);
}


function market_buy_1()
{
    robinhood_container = document.getElementById("robinhood-trading-container");
    
    data_input_row = document.createElement("div");
    data_input_row.className = "row";
    data_input_row.style = "padding-left:1%;padding-top:1%;";
    data_input_row.id = "order-parameters-div";
    
    data_input_row.innerHTML = "<div class='col-md-2'>"
                             + "    <button type='button' style='background-color:#2a2c39;outline:none;cursor:default;' class='btn btn-disabled'>"
                             + "        <h4 style='display:inline;' class='robinhood-green' style=display:inline;'>"
                             + "        Number of Shares:</h4>"
                             + "    </button>"
                             + "</div>"
                             + "<div class='col-md-2'>"
                             + "    <div class='form-group' id='num-shares-box'>"
                             + "        <input type='text' class='form-control' id='num-shares'>"
                             + "    </div>"
                             + "</div>"
                             + "<div class='col-md-3'>"
                             + "    <button type='button' style='background-color:#2a2c39;outline:none;cursor:default;' class='btn btn-disabled'>"
                             + "        <h4 class='robinhood-green' style='display:inline;'>Current Price:&nbsp; </h4>"
                             + "        <h4 class='robinhood-white' style='display:inline;' id='market-buy-price'></h4>"
                             + "    </button>"
                             + "</div>"
                             + "";
    
    // Update the price of the stock every 5 seconds. 
    
    document.write("Keep working here.  I think that I should just have this interval fire every 5 seconds regardless of what I do with it.");
    
    robinhood_container.appendChild(data_input_row);
}

function limit_buy_1()
{
    
}

function initiate_buy_order()
{
    // Clear old order entry div if another one was already open
    order_div = document.getElementById("order-div");
    if(order_div != null)
    {
        cancel_order_entry();
    }

    robinhood_container = document.getElementById("robinhood-trading-container");
    
    order_type_row = document.createElement("div");
    order_type_row.className = "row";
    order_type_row.id = "order-div";
    order_type_row.style = "padding-left: 1%;padding-top:1%;"
    
    order_type_row.innerHTML = "<div class='col-md-1'>"
                             + "<button type='button' style='background-color:#2a2c39;outline:none;cursor:default;' class='btn btn-disabled'>"
                             + "    <h4 style='display:inline;' class='robinhood-green' style=display:inline;'>"
                             + "    Type of Order:</h4>"
                             + "</button>"
                             + "</div>"
                             + "<div class='col-md-1'>"
                             + "    <button type='button' class='btn btn-info btn-block'"
                                 + "onclick='market_buy_1()'>Market Buy</button>"
                             + "</div>"
                             + "<div class='col-md-1'>"
                             + "    <button type='button' class='btn btn-info btn-block'"
                                 + "onclick-'limit_buy_1()'>Limit Buy</button>"
                             + "</div>"
                             + "<div class='col-md-1'>"
                             + "    <button type='button' class='btn btn-danger btn-block'"
                                 + "onclick='cancel_order_entry()'>Cancel</button>"
                             + "</div>"
                             + "<div class='col-md-8'></div>";
                             
    robinhood_container.appendChild(order_type_row);
}

function initiate_sell_order()
{
    // Clear old order entry div if another one was already open
    order_div = document.getElementById("order-div");
    if(order_div != null)
    {
        cancel_order_entry();
    }
    
    robinhood_container = document.getElementById("robinhood-trading-container");
    
    order_type_row = document.createElement("div");
    order_type_row.className = "row";
    order_type_row.id = "order-div";
    order_type_row.style = "padding-left:1%;padding-top:1%;"
    
    order_type_row.innerHTML = ""
                             + "<div class='col-md-1'>"
                             + "<button type='button' style='background-color:#2a2c39;outline:none;cursor:default;' class='btn btn-disabled'>"
                             + "    <h4 style='display:inline;' class='robinhood-green' style=display:inline;'>"
                             + "    Type of Order:</h4>"
                             + "</button>"
                             + "</div>"
                             + "<div class='col-md-1'>"
                             + "    <button type='button' style='background-color:#FFFFFF;' class='btn btn-block'"
                                 + "onclick='market_sell_1()'>Market Sell</button>"
                             + "</div>"
                             + "<div class='col-md-1'>"
                             + "    <button type='button' style='background-color:#FFFFFF;' class='btn btn-info btn-block'"
                                 + "onclick-'limit_sell_1()'>Limit Sell</button>"
                             + "</div>"
                             + "<div class='col-md-1'>"
                             + "    <button type='button' class='btn btn-danger btn-block'"
                                 + "onclick='cancel_order_entry()'>Cancel</button>"
                             + "</div>"
                             + "<div class='col-md-8'></div>";
                             
    robinhood_container.appendChild(order_type_row);
}

function update_current_price()
{
    ws.send("GetStockData:" + String(stock_ticker));
}

