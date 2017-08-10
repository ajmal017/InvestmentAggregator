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
    }
    else if(message_text.indexOf("CompanyDescription") >= 0)
    {
        update_company_description(message_text);
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

