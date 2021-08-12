### Watch Party!

Hi! Welcome to my Chat application, called Watch Party! This is a single page application that has been written to MIMIC the underlying technologies that single page Javascript frameworks (e.g. React) are built upon. The application lets users create a profile, with the username and password (encrypted using bcrypt) being stored in a MySQL database. Users are able to invite up to 5 other friends into a chat room using the specified Magic Link that appears at the top of every chat room. Users are also able to create as many different chat rooms as desired. As users navigate through the website, the URLs are changed accordingly using history.pushState (to allow back and forward functionality) and the corresponding divs are shown and hidden within popstate. The backend for the application has been written using the Flask framework in Python with dynamic routes to render data as required. I hope you enjoy using this application!!


### Usage

- Ensure that you have a working version of Python installed.
- Run the SQL commands within the migrations folder to set up the tables required to store user data.
- !IMPORTANT Create a secrets.cfg file in the root directory with the following structure (this file is used for connecting to the database and securely storing user information. Without this, the application will not work):
  - [secrets]
  - PEPPER = ~Some arbitrary long random string to prepend to the password before encrypting e.g. abcdefghijklmnopqrstuvwxyz~
  - DB_USERNAME = ~Name of MYSQL DB username e.g. root~
  - DB_PASSWORD = ~Password corresponding to DB username~
- Navigate to the root directory and run: python app.py :from the command line.
- Copy and paste the URL that the Flask server has locally hosted and enjoy using the application!!
