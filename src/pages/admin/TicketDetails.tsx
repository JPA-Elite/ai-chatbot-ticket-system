import React from 'react';
import TicketDetail from '../../components/tickets/TicketDetail';

interface TicketDetailsProps {
  isAdmin?: boolean;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({ isAdmin = false }) => {
  return <TicketDetail isAdmin={isAdmin} />;
};

export default TicketDetails;