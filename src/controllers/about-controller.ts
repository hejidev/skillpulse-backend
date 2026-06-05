import { Request, Response } from "express";
import * as aboutService from "../services/about-service";
import { io } from "../server";

export const getAbout = async (
  req: Request,
  res: Response
) => {
  try {
    const about =
      await aboutService.getAboutPage();

    res.json({
      success: true,
      data: about,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch about page",
    });
  }
};

export const getAdminAboutPage =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const about =
        await aboutService.getAdminAbout();

      res.json({
        success: true,
        data: about,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch",
      });
    }
  };

export const updateAbout =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const about =
        await aboutService.updateAboutPage(
          req.body
        );

      io.to("admin-admin").emit(
        "about-updated",
        about
      );

      res.json({
        success: true,
        data: about,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Failed to update about page",
      });
    }
  };

export const deleteAbout =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      await aboutService.deleteAboutPage();

      io.to("admin-admin").emit(
        "about-deleted"
      );

      res.json({
        success: true,
        message:
          "About page deleted",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Failed to delete about page",
      });
    }
  };