import e from 'express';

import cors from 'cors';

const app = e();

app.use(e.json());
app.use(e.urlencoded({ extended: true }));
app.use(cors());
