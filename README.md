import os

readme_content = """# ILOPRISAA Secure Digital Athlete Document Management System

## Introduction
The ILOPRISAA Document Management System (DMS) aims to replace the traditional, folder-based method of tracking physical documents with a centralized, secure digital record. It streamlines the submission, review, and verification of athlete credentials such as PSA birth certificates, medical clearances, and school IDs.

The system operates on three main vantage points:
* **Athletes:** Submit physical documents to coaches, and log in to view their own file and track the status of each document (Draft, Pending review, Verified, or Action required).
* **Coaches:** Responsible for scanning or photographing the physical documents and uploading them to the system. They manage and view documents exclusively for their own specific roster.
* **League Admins (Committee):** Have full visibility across all colleges to review submitted documents, verify records, and access an immutable audit trail of who uploaded and verified what, and when.

### Key Security Features
* **Row-Level Security (RLS):** Enforced at the PostgreSQL database level, ensuring users can only access data relevant to their specific role (e.g., an athlete cannot view another athlete's file).
* **Obfuscated Storage:** Storage paths are namespaced per athlete UUID to prevent guessable file links.
* **Tamper Detection:** Every uploaded document is fingerprinted with a SHA-256 hash to detect if the file has been altered.
* **Expiring Links:** Download links for documents expire after 60 seconds for added security.

## Tech Stack
* **Frontend Framework:** React with TypeScript, bundled via Vite.
* **Routing:** React Router DOM (Standard Single Page Application client-side routing).
* **State Management & Data Fetching:** TanStack Query (React Query) v5 for server state and background caching, coupled with custom stores for auth state.
* **Styling:** Tailwind CSS.
* **Backend & Database:** Supabase (PostgreSQL) handling Authentication, Database, Row-Level Security, and Storage.

## Getting Started

Follow these instructions to set up and run the project on a new local development machine.

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher recommended)
* npm, yarn, or pnpm
* A [Supabase](https://supabase.com/) project to host the database and authentication.

### Installation

1. **Clone the repository**