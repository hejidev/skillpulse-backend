import About from "../models/About";

export const getAboutPage = async () => {
  return await About.findOne({
    published: true,
  });
};

export const getAdminAbout = async () => {
  return await About.findOne();
};

export const updateAboutPage = async (
  data: any
) => {
  let about = await About.findOne();

  if (!about) {
    about = await About.create(data);
  } else {
    Object.assign(about, data);
    await about.save();
  }

  return about;
};

export const deleteAboutPage =
  async () => {
    return await About.deleteMany({});
  };