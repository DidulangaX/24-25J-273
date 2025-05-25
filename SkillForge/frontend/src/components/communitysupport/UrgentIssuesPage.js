
import React from 'react';
import QuestionList from './QuestionList';

export default function UrgentIssuesPage() {
  // pass a prop so it starts with “High” filter
  return <QuestionList initialFilterUrgency="High" />;
}
