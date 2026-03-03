# Employer Utilization Report API

## Context

Employer groups pay for their employees' health benefits. They need visibility into how their members are actually using the services we provide — this is the primary data they use when deciding whether to renew their contract.

**This dashboard is high-stakes.** The employers who see this data are our biggest renewal risk. If utilization looks low, they question the value of the program. If the data is wrong, that's worse than showing no data at all.

## Overview

Build an API that powers an employer-facing utilization dashboard. The dashboard gives employer group administrators a view into member health service usage, engagement metrics, and trends over time.

## Endpoints

### 1. Utilization Summary

Returns aggregate utilization data for a given employer group over a date range.

**Response should include:**
- Monthly visit counts broken down by type (in-person, virtual, mental health)
- Total unique members who used services in the period
- Member engagement rate
- Top 5 diagnoses by visit volume
- Month-over-month change in total visits

### 2. Member Engagement

Returns engagement-level data for active members in the employer group.

**Response should include:**
- Total active member count
- App download count
- Health assessments (PHAs) completed count
- Engagement rate

### 3. Top Diagnoses

Returns the most common diagnoses across the member population for the employer group.

**Response should include:**
- Diagnosis name
- Visit count per diagnosis
- Filterable by date range

### 4. CSV Export

Allows the employer admin to export the utilization summary as a CSV file.

**CSV should include columns for:**
- Month
- In-person visits
- Virtual visits
- Mental health visits
- Total visits
- Unique members seen
- Engagement rate
- Top diagnosis for the month

## Filtering

- All endpoints should accept an optional date range (start date, end date)
- When no date range is provided, default to the last 12 months
- All data should be scoped to the requesting user's employer group

## Permissions

Only users with the `viewReports` permission should have access to these endpoints.

## Data Notes

- Only active members should be included in all calculations
- Engagement rate should reflect the proportion of members who have actually used services
- Visit data comes from the `visits` collection; member data from the `members` collection
