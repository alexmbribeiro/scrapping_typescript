import { instagramFetch } from "./controller/instagramFetchController"
import express, { Request, Response } from 'express';
import cors from 'cors';
import { instagramFetchWithLogin } from "./controller/instagramFetchControllerWithLogin";

const app = express();

app.use(express.json());

// Allow requests from localhost:???
app.use(cors({
  origin: 'localhost:???'
}));



app.post('/instagram', async (req: Request, res: Response): Promise<void> => {
  const { username } = req.body;

  console.log(username)

  if (!username) {
    res.status(400).json({ error: 'Username is required in the body' });
    return;
  }

  try {
    const data = await instagramFetch(username);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch Instagram data' });
  }
});

app.post('/instagramWithLogin', async (req: Request, res: Response): Promise<void> => {
  const { username } = req.body;

  console.log(username)

  if (!username) {
    res.status(400).json({ error: 'Username is required in the body' });
    return;
  }

  try {
    const data = await instagramFetchWithLogin(username);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch Instagram data' });
  }
});


app.listen(3000, () => console.log('API running on http://localhost:3000'));
