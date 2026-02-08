import { AlertCircle, CheckCircle, Clock, ArrowRight } from "lucide-react";

export const getStatusIcon = (status: string) => {
    switch (status) {
        case "open":
            return <Clock className="h-5 w-5 text-yellow-500" />;
        case "pending":
            return <Clock className="h-5 w-5 text-yellow-500" />;
        case "accepted":
        case "in-progress":
            return <ArrowRight className="h-5 w-5 text-blue-500" />;
        case "resolved":
        case "closed":
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        default:
            return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
};