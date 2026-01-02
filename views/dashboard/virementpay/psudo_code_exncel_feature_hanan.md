1️⃣ Planning : 
 Problem is when hanan get the payroll file it stuck and waste a lot of time to remake other file to match the banck templates , the goal is to automate this process by creating a tool that can parse the payroll file and automatically generate the bank-compatible format.

2️⃣ Solution Approach:
- Create an Excel parser that can read the payroll file format
- Extract employee data (names, RIB, amounts)
- Transform the data to match the bank template format
- Generate a new Excel file with the correct structure
- Provide a user-friendly interface for uploading and downloading


2️⃣ Requirements Analysis
- be able to upalodd the excel file 
- validate the file with the standart input wihs is the payroll file that hanana have 
- store the data to user session 
- display the parsed data to the user for review
- generate the bank-compatible file format for download