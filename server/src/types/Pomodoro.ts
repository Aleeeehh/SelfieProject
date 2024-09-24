type Pomodoro = {
	id: string;
	owner: string;
	studyTime: number;
	pauseTime: number;
	cycles: number;
	createdAt?: Date;
	updatedAt?: Date;
};

export default Pomodoro;
