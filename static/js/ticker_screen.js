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
    
    
    
    
    
    
    // Uncomment this later!!!!!!
    
    
    
    
      
    //stock_update_interval_timer = setInterval(function() { update_current_price() }, 5000);
};

ws.onmessage = function(received_message)
{
    message_text = received_message.data.trim();

    if(message_text.indexOf("ValidationSucceeded") >= 0)
    {
        validation_suceeded(message_text);
    }
    else if(message_text.indexOf("ValidationFailed") >= 0)
    {
        validation_failed(message_text);
    }
    else if(message_text.indexOf("CompanyName:") >= 0)
    {
        update_company_name(message_text);
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
        update_dividend_history_data(message_text);
	}
	else if(message_text.indexOf("DividendRecord") >= 0)
	{
        update_dividend_record(message_text);
	}
	else if(message_text.indexOf("BB") >= 0)
	{
        update_bollinger_bands(message_text);
	}
    else if(message_text.indexOf("RobinhoodLoggedIn") >= 0)
    {
        update_robinhood_logged_in(message_text);
    }
    else if(message_text.indexOf("Position") >= 0)
    {
        update_position(message_text);
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

function cancel_order()
{
    parent = document.getElementById("robinhood-trading-container");
    order_div = document.getElementById("order-div");
    
    parent.removeChild(order_div);

    order_parameters_div = document.getElementById("order-parameters-div");
    if(order_parameters_div != null)
    {
        parent.removeChild(order_parameters_div);
    }
    
    order_confirm_row = document.getElementById("order-confirm-row");
    if(order_confirm_row != null)
    {
        parent.removeChild(order_confirm_row);
    }


}

function market_buy_1()
{
    robinhood_container = document.getElementById("robinhood-trading-container");
    
    if(document.getElementById("order-parameters-div") != null)
    {
        robinhood_container.removeChild(document.getElementById("order-parameters-div"));
    }
    
    if(document.getElementById("order-confirm-row") != null)
    {
        robinhood_container.removeChild(document.getElementById("order-confirm-row"));
    }
    
    data_input_row = document.createElement("div");
    data_input_row.className = "row";
    data_input_row.style = "padding-left:1%;padding-top:1%;";
    data_input_row.id = "order-parameters-div";
    
    data_input_row.innerHTML = "<div class='col-md-2'>"
                             + "    <button type='button' style='background-color:#2a2c39;outline:none;cursor:default;' class='btn btn-disabled'>"
                             + "        <h4 style='display:inline;' class='robinhood-green' style=display:inline;'>"
                             + "            Number of Shares:"
                             + "        </h4>"
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
                             + "</div>";

    order_confirm_row = document.createElement("div");
    order_confirm_row.className = "row";
    order_confirm_row.style="padding-left:1%;padding-top:1%;";
    order_confirm_row.id = "order-confirm-row"
    
    document.getElementById("cancel-button-div").innerHTML = "";
    
    order_confirm_row.innerHTML = "<div class='col-md-1'>"
                                + "    <button type='button' style='background-color:#20CE99;' class='btn btn-block' onclick='submit_market_buy()'>Confirm Order</button>"
                                + "</div>"
                                + "<div class='col-md-1'>"
                                + "    <button type='button' style='background-color:#FB5229;' class='btn btn-block' onclick='cancel_order()'>Cancel</button>"
                                + "<div class='col-md-9'></div>";
            
    robinhood_container.appendChild(data_input_row);
    robinhood_container.appendChild(order_confirm_row);
    
    

}

function limit_buy_1()
{
    
    
    robinhood_container = document.getElementById("robinhood-trading-container");
    
    if(document.getElementById("order-parameters-div") != null)
    {
        robinhood_container.removeChild(document.getElementById("order-parameters-div"));
    }
    
    if(document.getElementById("order-confirm-row") != null)
    {
        robinhood_container.removeChild(document.getElementById("order-confirm-row"));
    }
    
    data_input_row = document.createElement("div");
    data_input_row.className = "row";
    data_input_row.style = "padding-left:1%;padding-top:1%";
    data_input_row.id = "order-parameters-div";
    
    data_input_row.innerHTML = "<div class='col-md-2'>"
                             + "    <button type='button' style='background-color:#2a2c39;outline:none;cursor:default;' class='btn btn-disabled'>"
                             + "        <h4 style='display:inline;' class='robinhood-green' style=display:inline;'>"
                             + "            Number of Shares:"
                             + "        </h4>"
                             + "    </button>"
                             + "</div>"
                             + "<div class='col-md-2'>"
                             + "    <div class='form-group' id='num-shares-box'>"
                             + "        <input type='text' class='form-control' id='num-shares'>"
                             + "    </div>"
                             + "</div>"
                             + "<div class='col-md-1'>"
                             + "    <button type='button' style='background-color:#2a2c39;outline:none;cursor:default;' class='btn btn-disabled'>"
                             + "        <h4 style='display:inline;' class='robinhood-green' style='display:inline;'>"
                             + "            Limit Price:"
                             + "        </h4>"
                             + "    </button>"
                             + "</div>"
                             + "<div class='col-md-2'>"
                             + "    <div class='form-group' id='limit-price-box'>"
                             + "        <input type='text' class='form-control' id='num-shares'>"
                             + "    </div>"
                             + "</div>";

    order_confirm_row = document.createElement("div");
    order_confirm_row.className = "row";
    order_confirm_row.style="padding-left:1%;padding-top:1%;";
    order_confirm_row.id = "order-confirm-row"
    
    document.getElementById("cancel-button-div").innerHTML = "";
    
    order_confirm_row.innerHTML = "<div class='col-md-1'>"
                                + "    <button type='button' style='background-color:#20CE99;' class='btn btn-block' onclick='submit_limit_buy()'>Confirm Order</button>"
                                + "</div>"
                                + "<div class='col-md-1'>"
                                + "    <button type='button' style='background-color:#FB5229;' class='btn btn-block' onclick='cancel_order()'>Cancel</button>"
                                + "<div class='col-md-9'></div>";
            
    robinhood_container.appendChild(data_input_row);
    robinhood_container.appendChild(order_confirm_row);
}

function initiate_buy_order()
{
    // Clear old order entry div if another one was already open
    order_div = document.getElementById("order-div");
    if(order_div != null)
    {
        cancel_order();
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
                             + "    <button type='button' style='background-color:#FFFFFF;' class='btn btn-block'"
                                 + "onclick='market_buy_1()'>Market Buy</button>"
                             + "</div>"
                             + "<div class='col-md-1'>"
                             + "    <button type='button' style='background-color:#FFFFFF;' class='btn btn-block'"
                                 + "onclick='limit_buy_1()'>Limit Buy</button>"
                             + "</div>"
                             + "<div class='col-md-1' id='cancel-button-div'>"
                             + "    <button type='button' style='background-color:#FB5229;' class='btn btn-block'"
                                 + "onclick='cancel_order()'>Cancel</button>"
                             + "</div>"
                             + "<div class='col-md-8'></div>";
                             
    robinhood_container.appendChild(order_type_row);
}

function market_sell_1()
{
    
}

function limit_sell_1()
{
    
}

function initiate_sell_order()
{
    // Clear old order entry div if another one was already open
    order_div = document.getElementById("order-div");
    if(order_div != null)
    {
        cancel_order();
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
                             + "    <button type='button' style='background-color:#FFFFFF;' class='btn btn-block'"
                                 + "onclick-'limit_sell_1()'>Limit Sell</button>"
                             + "</div>"
                             + "<div class='col-md-1'>"
                             + "    <button type='button' style='background-color:#FB5229;' class='btn btn-block'"
                                 + "onclick='cancel_order()'>Cancel</button>"
                             + "</div>"
                             + "<div class='col-md-8'></div>";
                             
    robinhood_container.appendChild(order_type_row);
}

function submit_market_buy()
{
    
}

function submit_limit_buy()
{
    
}

function submit_market_sell()
{
    
}

function submit_limit_sell()
{
    
}

function update_current_price()
{
    ws.send("GetStockData:" + String(stock_ticker));
}

