/* ------------------------------------------------------------------------- */
/* Developer: Andrew Kirfman                                                 */
/* Project: Investment Aggregator                                            */
/*                                                                           */
/* File: ./static/js/ticker_screen_onload.js                                 */
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
/* Code to Execute on Page Load                                              */
/* ------------------------------------------------------------------------- */

function update_footer_date()
{
    date = new Date().getFullYear();
    document.getElementById('footer-text').innerHTML = "&copy; "
        + date + ": Andrew Kirfman & Cuong Do";
};

function set_browser_title()
{
	var browserTitle = document.getElementById("main-browser-title")
	browserTitle.innerHTML = stock_ticker + ": InvestmenetAggregator";
	
}

function update_stockinvest()
{
    // Set the stockinvest div
    var stockinvest = document.getElementById("panel-body-2-div");
    stockinvest.innerHTML = "<object type=\"text/html\" data=\"https://stockinvest.us/technical-analysis/" 
		+ String(stock_ticker) + "?utm_campaign=2\" style=\"width:100%; height:100%;\"></object>";
}

function update_stockflare()
{
	var stockflare = document.getElementById("panel-body-11-div");
    stockflare.innerHTML = "<object type=\"text/html\" data=\"https://stockflare.com/$/stocks/" 
		+ String(stock_ticker) + ".o\" style=\"width:100%; height:100%;\"></object>";	
}

function update_dividend_history()
{
    var stockinvest = document.getElementById("panel-body-4-div");
    stockinvest.innerHTML = "<object type=\"text/html\" data=\"https://dividata.com/stock/" 
		+ String(stock_ticker) + "?utm_campaign=2\" style=\"width:100%; height:100%;\"></object>";	
}

function update_zachs_1()
{

	var zachs_1 = document.getElementById("panel-body-3-div");
	zachs_1.innerHTML = "<object type=\"text/html\" data=\"https://www.zacks.com/stock/quote/" 
		+ String(stock_ticker) + "?utm_campaign=2\" style=\"width:100%; height:100%;\"></object>";
}

function update_zachs_2()
{
	var zachs_2 = document.getElementById("panel-body-5-div");
	zachs_2.innerHTML = "<object type=\"text/html\" data=\"https://www.zacks.com/stock/chart/" 
		+ String(stock_ticker) + "/price-consensus-eps-surprise-chart\" style=\"width:100%; height:100%;\"></object>";
}

function update_zachs_3()
{
	var zachs_3 = document.getElementById("panel-body-6-div");
	zachs_3.innerHTML = "<object type=\"text/html\" data=\"https://www.zacks.com/stock/quote/" 
		+ String(stock_ticker) + "/financial-overview\" style=\"width:100%; height:100%;\"></object>";
	
}

function update_zachs_4()
{
	var zachs_4 = document.getElementById("panel-body-7-div");
	zachs_4.innerHTML = "<object type=\"text/html\" data=\"https://www.zacks.com/stock/quote/" 
		+ String(stock_ticker) + "/income-statement\" style=\"width:100%; height:100%;\"></object>";	
}

function update_zachs_5()
{
	var zachs_5 = document.getElementById("panel-body-8-div");
	zachs_5.innerHTML = "<object type=\"text/html\" data=\"https://www.zacks.com/stock/quote/" 
		+ String(stock_ticker) + "/balance-sheet\" style=\"width:100%; height:100%;\"></object>";
}

function update_zachs_6()
{
	var zachs_6 = document.getElementById("panel-body-9-div")
	zachs_6.innerHTML = "<object type=\"text/html\" data=\"https://www.zacks.com/stock/quote/" 
		+ String(stock_ticker) + "/detailed-estimates\" style=\"width:100%; height:100%;\"></object>";
}

function addLoadEvent(func) {
    var oldonload = window.onload;

    if(typeof window.onload != 'function')
    {
        window.onload = func;
    }
    else
    {
        window.onload = function()
        {
            if(oldonload)
            {
                oldonload();
            }

            func();
        };
    }
}

addLoadEvent(update_footer_date);
addLoadEvent(set_browser_title);
addLoadEvent(update_stockinvest);
addLoadEvent(update_stockflare);
addLoadEvent(update_zachs_1);
addLoadEvent(update_zachs_2);
addLoadEvent(update_zachs_3);
addLoadEvent(update_zachs_4);
addLoadEvent(update_zachs_5);
addLoadEvent(update_zachs_6);
addLoadEvent(update_dividend_history);
