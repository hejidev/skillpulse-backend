import express from "express";
import { globalSearch } from "../controllers/search-controller";
import { isAuth } from "../middleware/auth-middleware";


const router = express.Router();

router.get("/", isAuth, globalSearch);

export default router;