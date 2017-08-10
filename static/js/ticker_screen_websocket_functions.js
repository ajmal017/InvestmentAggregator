/* ------------------------------------------------------------------------- */
/* Developer: Andrew Kirfman                                                 */
/* Project: Investment Aggregator                                            */
/*                                                                           */
/* File: ./static/js/ticker_screen_websocket_functions.js                    */
/* ------------------------------------------------------------------------- */

function validation_suceeded(message_text)
{
    ticker = meessage_text.split(":")[1];
    window.location.href = "/ticker?" + ticker;
}

function validation_failed(message_text)
{
    // TODO: Fill this in later to update the ticker box to indicate that 
    // the requested ticker was not found in the database.  
}

function update_company_name(message_text)
{
    descriptionTitleBox = document.getElementById("company-description-title");
    company_name = message_text.split(":")[1];
    descriptionTitleBox.innerHTML = company_name + " Company Description";
}

function update_stock_data(message_text)
{
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

    // Incorporate this current stock data into the existing HTML
    document.getElementById("stock-price").innerHTML = "$" + price;
    document.getElementById("stock-percent-change").innerHTML = percent_change;

    if(percent_change.indexOf("-") >= 0)
    {
        percent_change_box.className = "robinhood-red";
    }
    else
    {
        percent_change_box.className = "robinhood-green";
    }

    document.getElementById("stock-previous-close").innerHTML = "$" + previous_close;
    document.getElementById("stock-open").innerHTML = "$" + open_price;
    document.getElementById("stock-volume").innerHTML = volume;
    document.getElementById("stock-pe-ratio").innerHTML = pe_ratio;
    document.getElementById("stock-peg-ratio").innerHTML = peg_ratio;
    document.getElementById("stock-market-cap").innerHTML = market_cap;
    document.getElementById("stock-book-value").innerHTML = book_value;
    document.getElementById("stock-average-volume").innerHTML = average_volume;
    document.getElementById("stock-dividend-share").innerHTML = dividend_share;
    document.getElementById("stock-dividend-yield").innerHTML = dividend_yield;
    document.getElementById("stock-earnings-share").innerHTML = earnings_per_share;
    document.getElementById("stock-ebitda").innerHTML = ebitda
    document.getElementById("stock-50-day-ma").innerHTML = fifty_day_ma;
    document.getElementById("stock-days-high").innerHTML = "$" + days_high;
    document.getElementById("stock-days-low").innerHTML = "$" + days_low;
    document.getElementById("stock-year-high").innerHTML = "$" + year_high;
    document.getElememtById("stock-year-low").innerHTML = "$" + year_low;
    document.getElementById("stock-200-day-ma").innerHTML = "$" + two_hundred_day_ma;
}

function update_company_description(message_text)
{
    message_text = message_text.replace("CompanyDescription:", "");
    var description_div = document.getElementById("style-1");
    description_div.innerHTML = message_text;
}

