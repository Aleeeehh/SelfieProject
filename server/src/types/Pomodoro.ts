type Pomodoro = {
	id: string;
	ownerId: string;
	studyTime: number;
	pauseTime: number;
	cycles: number;
	createdAt: Date;
	updatedAt: Date;
};

export default Pomodoro;
