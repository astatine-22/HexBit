export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      passed: false,
      error: "This endpoint only accepts POST requests.",
    });
  }

  const body = req.body;

  if (!body || typeof body !== "object") {
    return res.status(400).json({
      passed: false,
      error: "Please send a JSON body with stdout and expectedOutput.",
    });
  }

  const { stdout, expectedOutput } = body;

  if (typeof stdout !== "string" || typeof expectedOutput !== "string") {
    return res.status(400).json({
      passed: false,
      error: "Please include both stdout and expectedOutput as strings.",
    });
  }

  const normalize = (value) => value.trim().replace(/\r\n/g, "\n");

  return res.status(200).json({
    passed: normalize(stdout) === normalize(expectedOutput),
  });
}
