
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
- Supabase(For Database)
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


If you want to run and use it locally follow these steps:

*Running it locally will not allow you to access the online database

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


<img width="1919" height="941" alt="Screenshot 2026-03-30 160709" src="https://github.com/user-attachments/assets/d236b21e-8a66-44c0-a5fa-c709b01d1817" />
<img width="1919" height="943" alt="Screenshot 2026-03-30 160725" src="https://github.com/user-attachments/assets/00f90f2b-0819-4cfa-91c0-94df44442ecf" />
<img width="1919" height="945" alt="Screenshot 2026-03-30 160804" src="https://github.com/user-attachments/assets/ec01bc24-bbf2-4978-b642-37981f8d7be2" />
<img width="1919" height="937" alt="Screenshot 2026-03-30 160822" src="https://github.com/user-attachments/assets/13a60084-be29-40b6-b5a3-b1a5e6d8e454" />
<img width="1915" height="940" alt="Screenshot 2026-03-30 160850" src="https://github.com/user-attachments/assets/c7d57d7d-0f42-42bd-b6c8-cbfa55e6f762" />
<img width="1911" height="953" alt="Screenshot 2026-03-30 160913" src="https://github.com/user-attachments/assets/6ab6d2e8-a3f9-4601-a019-ed71db0e7479" />
<img width="1919" height="927" alt="Screenshot 2026-03-30 161041" src="https://github.com/user-attachments/assets/1a23b66a-fda0-447a-94bd-fb44336edb3f" />
<img width="1919" height="1028" alt="Screenshot 2026-03-30 161051" src="https://github.com/user-attachments/assets/741eccba-c5be-45ea-a92c-e115c1a600fe" />
<img width="1919" height="1027" alt="Screenshot 2026-03-30 161159" src="https://github.com/user-attachments/assets/8e840ce4-e46b-49e0-9408-ef3681e5e5d0" />

  




## AI Acknowledgment

- **ChatGPT**: Used to help debug JavaScript issues and structure the project
- **ChatGPT**: Assisted in writing parts of the README and explaining concepts like event listeners and DOM manipulation
- **Chatgpt**: Used heavily for researching and learning about new technologies and how to implement them into the code
- **Copilot**: Used to review read.me
- **Copilot**:Used for adding comments


## Version Control
This project was developed using Git with multiple commits showing progress, including:
- Initial project setup
- UI design
- Chat functionality
- Bug fixes
- Final improvements
