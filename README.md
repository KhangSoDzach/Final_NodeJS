# Final_NodeJS
Final project of Nodejs 
# Project Evaluation Guide

## Project Overview
[Brief description of your project - replace this with your actual project description]

## Running the Application
1. Start the server by typing in the terminal: "docker compose up -d"
2. Access the application at: http://localhost (or open docker click on the nginx-1)


## Login Credentials
### Admin Account
- Username: admin@sourcecomputer.vn
- Password: admin123


## Project Structure
- `/models`: Database models
- `/routes`: API routes
- `/controllers`: Code logic
- `/views`: Frontend templates
- `/public`: Static assets

Thank you for evaluating this project!
ALIBABA

## Agent Prompt Template

When invoking an AI agent to work on this repository, start the prompt with the following two lines (copy-paste exactly):

"Strictly follow .agent/skills.manifest.json and only use folders under .agent/active-skills/ unless the user explicitly approves additional skills."

"If a task requires skills outside the manifest, list the missing skills and ask for explicit user approval before proceeding."

Usage: paste these two lines at the top of the agent prompt to enforce the project's skill whitelist and request explicit approval for any out-of-scope skills.