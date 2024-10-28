type Notification = {
    id?: string;
    sender?: string;
    receiver?: string;
    type: string;
    sentAt: Date;
    read?: boolean;
    data: any;
};

export default Notification;
