# Plex Library Exporter

Greetings! This extension is designed to allow users to download thier Plex libraries into a TXT, CSV, or JSON file.

Currently supported media types:
* TV Shows
* Movies
* Albums
* Tracks

Supported hostnames when viewing Plex:
* localhost
* 127.0.0.1
* app.plex.tx

## Instructions
After installing the add-on, open Plex in your browser using a supported hostname as seen above. Click on a library of your choice on the far left.

### BIG NOTES
1. When viewing movies, tv shows, or tracks (music), be sure you're in DETAILED view (dropdown option in plex is in the upper right corner).
2. When viewing albums (music) you must be in Grid view. For albums, a third column will be generated in your spreadsheet when viewing by Year, Release Date, Date Added, Date Played, or Plays
3. Websites/web apps typically use the character encoding UTF-8 by default. This is typically no problem for the English-speaking world as our character encodings are identical whether it's UTF-8, ASCII, or ANSI. However, some titles may use foreign symbols that may be incompatible with the encoding used by your spreadsheet software. Excel uses ANSI which messes up some music I have that use Asian characters. The solution, for Excel at least, is to use the "Get Data From Text" wizard and choose a UTF-8 variant that supports Asian languages (this will not affect your English titles because English encodings are consistent among all UTF-8 variants).

### How to Collect all the Titles?
Since all HTML elements are not loaded onto the page, the extesnion cannot grab all info without doing one of the two options below:

1. Click the *Stack Titles* checkbox. This will adjust the CSS styling rules on the page, causing all titles to appear on top of each other. The extesnion will be able to gather all info. You can then uncheck the box to return the page to normal.

2. After opening the extension, you can start scrolling through the page and the extension will be able to add titles as they load. This can be slow if you have *lots* of titles in a library so the above method may be recommended (and why I chose to make that other method!).