import redis from "redis";

let redisClient;

(async () => {
  redisClient = redis.createClient();

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
})();

export const moviesCache = async () => {
  const movies = await redisClient.get("movies");
  return movies ? JSON.parse(movies) : [];
};

export default redisClient;
