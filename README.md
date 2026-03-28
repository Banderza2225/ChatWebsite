
# Chat Website Project



## Project Description
This project is a simple web-based chat application that allows users to send and receive messages in real time.

You can create an account and login with that account.Upon creating your account you will receive an ID number that is unique to every account,and you can send a connection request to someone via there unique ID
,they will then receive it and they can accept the request if they wish.Once they accept you can start chatting by clicking on there name and typing out a message using the chat box. 

The purpose of this project is to demonstrate understanding of web development concepts such as frontend design, event handling, backend development .

## Technologies Used
- HTML
- CSS
- JavaScript
- PostgreSQL(originally SQLite but scrapped for use online because of data persistance issues)
- SQLite (only if you run it locally)
- Node.js
- Render(For hosting server)
#### Dependancies:
- pg (to access PostgreSQL database)
- bcryptjs (For encypting and checking passwords)
- cors
- express
- fs


## Setup Instructions

#### Live Demo
 If you want to use the online version and be able to use it like a normal chatting website to talk to anyone globally use the link below  

 click this link :  https://banderza2225.github.io/ChatWebsite/Website/index.html

*note that you may have to wait up to 50 seconds for the server to respond if it has been inactive for 15 mins.

#### Local Use

if you want to run and use it locally follow these steps:

Go to the main repo page and press the code button then dowloand the zip file,the file should start downloading :

<img width="1916" height="784" alt="Screenshot 2026-03-28 185833" src="https://github.com/user-attachments/assets/75d42a46-afed-4afa-8f89-26c27b16e4d3" />

Once its downloaded extrct the zip file:

<img width="763" height="314" alt="Screenshot 2026-03-28 185921" src="https://github.com/user-attachments/assets/43720c2a-daa3-448a-867e-80b8f64bba3f" />

Go into the ServerAndDatabase page clear the file path and type in cmd and enter:

<img width="978" height="398" alt="Screenshot 2026-03-28 190224" src="https://github.com/user-attachments/assets/08620d76-1cf2-4427-931e-1dacd3b93ffd" />


in command prompt type in the the command "npm install" then run the command  "node localserver.js" the cmd should print out "Server running on port 3000" and "Sqlite page running succsesfully":

<img width="1025" height="677" alt="Screenshot 2026-03-28 190351" src="https://github.com/user-attachments/assets/380108c5-e2cc-4c6d-b33d-9713799a691b" />

then go into the Website fol;der and run the index.html file:

<img width="854" height="412" alt="Screenshot 2026-03-28 190408" src="https://github.com/user-attachments/assets/253e3320-aa5b-43c2-8c8e-fdd3ecd25ae1" />

The website is running and ready for you to use:

<img width="1918" height="954" alt="Screenshot 2026-03-28 190531" src="https://github.com/user-attachments/assets/e328acce-42ff-474a-b2fa-c53d0e41a591" />



## How to Use/Usage
- Create an account if you dont have one
- Login to your account
- Send a request to a user with there ID number
- Accept a request from your pending request section to make them your connection
- Select a connection to chat to  by clicking there name
- Type your message in the text box  
- Press send
- Messages will appear in the chat window


## AI Acknowledgment

- **ChatGPT**: Used to help debug JavaScript issues and structure the project
- **ChatGPT**: Assisted in writing parts of the README and explaining concepts like event listeners and DOM manipulation
- **Chatgpt**: Used heavily for researching and learning about new technologies and how to implement them into the code
- **Copilot**: Used to review read.me


## Version Control
This project was developed using Git with multiple commits showing progress, including:
- Initial project setup
- UI design
- Chat functionality
- Bug fixes
- Final improvements
