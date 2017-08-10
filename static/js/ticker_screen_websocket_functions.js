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
    
}
