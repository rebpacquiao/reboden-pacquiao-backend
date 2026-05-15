import "dotenv/config";
import app from "./app";

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health:   GET http://localhost:${PORT}/health`);
  console.log(
    `Account:  GET http://localhost:${PORT}/api/ethereum/account/:address`,
  );
  console.log(
    `History:  GET http://localhost:${PORT}/api/ethereum/account/:address/history`,
  );
});
