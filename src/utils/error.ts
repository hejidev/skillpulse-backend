// utils/error.ts
export const handleError = (res: any, err: any, message = "Server error") => {
  console.error(err);
  res.status(500).json({ message });
};