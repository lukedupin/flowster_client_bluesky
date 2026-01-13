# Software Proposal Specification

## What We're Building
AI‑powered data collection platform embedded in Squarespace that converts conversations into MISMO 3.4 XML.

---

## Category

### Frontend – Full Page
- Progress‑tracked conversational form  
- JSON‑driven dynamic rendering  
- Squarespace code injection (blank template)  
- Tailwind CSS styling  

### Frontend – ChatBubble
- Preact component with Shadow DOM  
- Lightweight overlay interface  
- Style‑isolated via Shadow DOM  
- Tailwind CSS (scoped)  

### Backend Stack
- Flowster Core LLM framework  
- Gpt OSS 20Bs  
- JSON schema → data gathering  
- MISMO 3.4 XML output  
- LendingDoc API integration  

### API Endpoints
- Chat SSE – Real‑time conversational streaming  
- File Download – XML/JSON file retrieval  
- Session Management – User state persistence  
- Manual Data Entry – Direct form input  

### Pitfalls
- Problem: LLMs refuse to collect SSN, passwords, financial data  
- Solution: Hybrid approach (AI for general data, secure forms for PII)  
- Prompt engineering for legitimate business context  
- Manual extraction fallback for sensitive fields  

### Tech Stack

#### Frontend
- Preact  
- Vanilla JS  
- Tailwind  
- Shadow DOM  

#### Backend
- Flowster Core  
- Qwen 3  
- SSE streaming  

#### Output
- MISMO 3.4 XML → LendingDoc API  

#### Platform
- Squarespace code injection  

---

## Executive Summary
This document outlines the technical specification for an intelligent data gathering platform that integrates conversational AI with form completion. The system will be embedded within Squarespace websites and will guide users through complex data collection processes, ultimately generating MISMO 3.4 compliant XML outputs.

---

## System Polish and User Experience

### Workflow
A workflow document is loaded into the system, which guides the sections, fields, and some styling information.

#### Key Document Components
- **Section title** – logical grouping of fields.  
- **Bulleted list of fields**  
  - **Name**  
  - `{styling columns} 1-6. 6 is full width`  
  - **Data type** [string (default), number, currency, email, social security number, etc.]  
  - **Colon** defines the key name for a data field.  
  - **User lead‑in** – opening sentence that directs the user’s behavior.

#### Delivery
The system reads the user data definition document. Sections are rendered as micro UI, with the styling and data type directives. Each section must be fully completed before the next is provided. The UI from the last section persists, so users can “scroll up” to review/change any previous section.

### Example
```markdown
Default sentence lead‑in, this is the opening hello a user will see when they open the chat bubble. This should include suggestions for what to enter, types of actions that can be done and what to expect. Let's get started?

# Personal Information
Hello, first we'll need to learn a bit about you. Please write a short sentence including your full name, address, city, state and zip code.

First Name: {3} – The user's first name  
Last Name: {3} – The user's last name  
Email: {5} [email] – The user's email address (optional)  
Address: {4} – The user's home address  
City: {3} – The user's city  
State: {1} [state_code] – The user's current state, 2‑character code  
Zip Code: {1} [zip_code] – The user's zip code

# Financial Information
Now we're getting a bit more personal. Please provide a very brief description of your current employment, yearly earnings, assets and the desired lending amount.
…
```

---

## System Architecture

### Frontend Components

#### 1. Whole Page Chat Interface
- **Platform**: Squarespace (blank template with code injection)  
- **Core Features**:  
  - Full‑page conversational interface with progress tracking  
  - Dynamic form rendering driven by JSON configuration  
  - Visual progress completion indicators  
  - Real‑time validation and feedback  
- **Technical Implementation**:  
  - JSON‑based form schema defines sections, fields, and validation rules  
  - Progressive disclosure of form sections based on completion status  
  - Tailwind CSS for responsive, accessible styling  
  - Code block injection method for deployment  

#### 2. ChatBubble Widget
- **Platform**: Squarespace (code injection)  
- **Core Features**:  
  - Lightweight chat widget overlay  
  - Non‑intrusive UI component  
  - Expandable/collapsible interface  
- **Technical Implementation**:  
  - Preact‑based component (~3 KB footprint)  
  - Shadow DOM encapsulation to prevent style conflicts  
  - Isolated component lifecycle  
  - Tailwind CSS (scoped within Shadow DOM)  

### Backend Infrastructure

#### Core Framework Stack
- **LLM Framework**: Flowster Core  
  - Orchestrates conversational flows  
  - Manages context and session state  
  - Handles prompt engineering and response generation  
- **Language Model**: Qwen 3  
  - Primary conversational AI engine  
  - Optimized for data extraction tasks  
  - Configurable temperature and response parameters  
  - Provides advanced tool calling for programmable tasks  
  - *Thinking model shows great insight into decision making.*

#### Data Processing Pipeline

1. **Data Gathering Module**
   - JSON schema‑driven data collection  
   - Conversational extraction of user information  
   - Validation against schema requirements  
   - Progressive data accumulation  
   - **Input**: JSON configuration defining:
     - Required data fields  
     - Field types and validation rules  
     - Conditional logic and dependencies  
     - Section groupings  

2. **MISMO 3.4 XML Generator**
   - Transforms collected data into MISMO 3.4 compliant XML  
   - Validates against MISMO schema standards  
   - Handles nested data structures  
   - Maintains mortgage industry data integrity  
   - **Output**: Raw XML conforming to MISMO 3.4 specification  

3. **LendingDoc API Integration**
   - Submits finalized data to LendingDoc platform  
   - Handles authentication and authorization  
   - Error handling and retry logic  
   - Response validation  
