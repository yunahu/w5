import express from "express";
import {
  deleteMovie,
  first10movies,
  movieByID,
  updateMovieTitle,
} from "../services/db.js";
import redisClient, { moviesCache } from "../services/cache.js";

const router = express.Router();

router.get("/cache", async (req, res) => {
  let cachedMovies = await moviesCache();
  res.send(cachedMovies);
});

router.get("/", async (req, res) => {
  const result = await first10movies();
  let cachedMovies = await moviesCache();

  const combined = [
    ...result.map((x) => ({ id: x._id, title: x.title })),
    ...cachedMovies.filter(
      (x) => !result.some((y) => y._id.toString() === x.id)
    ),
  ];
  await redisClient.set("movies", JSON.stringify(combined));
  res.send(result);
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  let cachedMovies = await moviesCache();
  let movie = cachedMovies.find((x) => x.id === id);
  if (movie) {
    res.send(movie);
  } else {
    const result = await movieByID(id);
    if (result) {
      const simplified = { id: result._id, title: result.title };
      cachedMovies.push(simplified);
      await redisClient.set("movies", JSON.stringify(cachedMovies));
      res.send(simplified);
    } else {
      res.sendStatus(400);
    }
  }
});

router.patch("/:id", async (req, res) => {
  const id = req.params.id;
  const title = req.body.title;
  const result = await updateMovieTitle(id, title);
  if (result.acknowledged) {
    let cachedMovies = await moviesCache();
    let movie = cachedMovies.find((x) => x.id === id);
    if (movie) {
      movie.title = title;
    } else {
      cachedMovies.push({ id, title });
    }
    await redisClient.set("movies", JSON.stringify(cachedMovies));
    res.sendStatus(200);
  } else {
    res.status(500).send(result);
  }
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const result = await deleteMovie(id);
  if (result.deletedCount) {
    let cachedMovies = await moviesCache();
    cachedMovies = cachedMovies.filter((x) => x.id !== id);
    await redisClient.set("movies", JSON.stringify(cachedMovies));
    res.send(result);
  } else {
    res.status(400).send(result);
  }
});

export default router;
