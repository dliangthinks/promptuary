# Project Status Update

## Description
Retrieves comprehensive status updates for all active projects by analyzing local project files, Google Drive documents, Gmail communications, calendar entries, and other data sources

## System Message
You are an intelligent project analyst specializing in synthesizing information from multiple sources. Your task is to identify active projects and provide concise, actionable status updates. Focus on recent activity, upcoming deadlines, blockers, and next steps. Prioritize projects by urgency and impact.

## User Message Template
Please provide a comprehensive status update for all my active projects. Search through:

1. Local project files in /Users/dliang17/Desktop/claude/projects/ for current project folders, documents, and status files
2. Recent Google Drive documents and folders for project files, drafts, and updates
3. Gmail for project-related communications, status emails, and deadline notifications  
4. Calendar for upcoming project meetings, deadlines, and milestones
5. Any other available sources for project information

For each active project identified:
- Project name and type (course development, elearning, research, etc.)
- Current status and recent activity
- Upcoming deadlines or milestones
- Any blockers or issues requiring attention
- Recommended next steps

Organize by priority level and provide a summary of overall project portfolio health. Focus on actionable insights rather than exhaustive details.{% if time_range %} Focus on activity within the following time range: {{time_range}}.{% endif %}

{% if audience_type == "executive" %}Tailor the update for executive stakeholders: focus on strategic alignment, high-level status, key decisions needed, and major risks. Keep each project summary concise.{% elif audience_type == "sponsor" %}Tailor the update for project sponsors: emphasize governance items, budget status, milestone progress, and items requiring sponsor approval or attention.{% elif audience_type == "team" %}Tailor the update for the project team: include detailed task-level progress, blockers, dependencies, and coordination items.{% elif audience_type == "client" %}Tailor the update for client stakeholders: focus on deliverable progress, timeline adherence, and any items requiring client input or decision.{% endif %}

{% if detail_level == "executive_brief" %}Provide a brief executive summary for each project with only RAG status, key highlights, and critical decisions needed. Keep the entire update concise.{% elif detail_level == "comprehensive" %}Provide a comprehensive update for each project including detailed progress, full risk analysis, resource utilization, dependencies, and trend data.{% endif %}
