import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGOURI;
const client = new MongoClient(uri);
let db;

export async function connectToMongo() {
  try {
    await client.connect();
    console.log("Connected to the MongoDB database");
    db = client.db(process.env.MONGODBNAME);
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
}

export const first10movies = () =>
  db.collection("movies").find().limit(10).toArray();

export const movieByID = (id) =>
  db
    .collection("movies")
    .find(ObjectId.createFromHexString(id))
    .toArray()
    .then((x) => x[0]);

export const updateMovieTitle = (id, title) =>
  db
    .collection("movies")
    .updateOne({ _id: ObjectId.createFromHexString(id) }, { $set: { title } });

export const deleteMovie = (id) =>
  db.collection("movies").deleteOne({ _id: ObjectId.createFromHexString(id) });
