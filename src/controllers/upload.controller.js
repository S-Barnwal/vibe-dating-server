import crypto from "crypto";

export const getCloudinarySignature = async (
  req,
  res
) => {
  try {
    const timestamp = Math.floor(
      Date.now() / 1000
    );

    const folder = "vibe/profiles";

    const stringToSign =
      `folder=${folder}&timestamp=${timestamp}` +
      process.env.CLOUDINARY_API_SECRET;

    const signature = crypto
      .createHash("sha1")
      .update(stringToSign)
      .digest("hex");

    return res.status(200).json({
      success: true,
      data: {
        timestamp,
        signature,
        folder,
        cloudName:
          process.env.CLOUDINARY_CLOUD_NAME,
        apiKey:
          process.env.CLOUDINARY_API_KEY,
      },
    });
  } catch (error) {
    console.error(
      "Cloudinary signature error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate upload signature",
    });
  }
};