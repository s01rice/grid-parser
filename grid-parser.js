import fetch from 'node-fetch';
import { Parser } from 'htmlparser2';

class GridParser {
    constructor() {
        this.grid = {};
        this.max_x = 0;
        this.max_y = 0;
        this.in_td = false;
        this.current_data = [];
    }

    onopentag(name, attrs) {
        if (name === 'td') {
            this.in_td = true;
        }
    }

    onclosetag(tag) {
        if (tag === 'td') {
            this.in_td = false;
        } else if (tag === 'tr') {

            // Ensure we have exactly three pieces of data
            if (this.current_data.length === 3) {
                const [x, char, y] = this.current_data;

                // Skip the first row of the table "x-coordinate" and "y-coordinate"
                if (x === 'x-coordinate' || y === 'y-coordinate') {
                    this.current_data = []; // Reset current data for next row
                    return; // Skip this row
                }

                // console.log(`Captured data: x="${x}", char="${char}", y="${y}"`);

                try {
                    const xInt = parseInt(x);
                    const yInt = parseInt(y);

                    // Check if x and y are valid numbers
                    if (isNaN(xInt) || isNaN(yInt)) {
                        console.error(`Invalid x or y values: x="${x}", y="${y}"`);
                    } else {
                        this.grid[`${xInt},${yInt}`] = char;
                        this.max_x = Math.max(this.max_x, xInt);
                        this.max_y = Math.max(this.max_y, yInt);
                    }
                } catch (e) {
                    console.error(`Error parsing coordinates: ${e.message}`);
                }
            } else {
                console.error(`Invalid row data (not enough columns): ${this.current_data}`);
            }
            this.current_data = [];
        }
    }

    ontext(text) {
        if (this.in_td) {
            this.current_data.push(text.trim());
        }
    }
}

async function printGridFromUrl(url) {
    try {
        console.log(`Fetching URL: ${url}`);
        const response = await fetch(url);
        const html = await response.text();
        console.log(`Fetched ${html.length} characters of HTML`);

        const parser = new GridParser();
        const htmlParser = new Parser({
            onopentag: parser.onopentag.bind(parser),
            onclosetag: parser.onclosetag.bind(parser),
            ontext: parser.ontext.bind(parser),
        });
        htmlParser.write(html);
        htmlParser.end();

        // Check the parsed grid size
        console.log(`Grid size: ${parser.max_x + 1} x ${parser.max_y + 1}`);
        if (isNaN(parser.max_x) || isNaN(parser.max_y)) {
            console.error('Grid parsing failed: max_x or max_y is NaN');
            return;
        }

        // Print the grid
        for (let y = 0; y <= parser.max_y; y++) {
            let row = '';
            for (let x = 0; x <= parser.max_x; x++) {
                row += parser.grid[`${x},${y}`] || ' ';
            }
            console.log(row);
        }
    } catch (e) {
        console.log(`An error occurred: ${e}`);
    }
}

const url = "https://docs.google.com/document/d/e/2PACX-1vSHesOf9hv2sPOntssYrEdubmMQm8lwjfwv6NPjjmIRYs_FOYXtqrYgjh85jBUebK9swPXh_a5TJ5Kl/pub";
printGridFromUrl(url);
