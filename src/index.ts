import app from './app';

const port = Number(process.env.PORT ?? 3000);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}