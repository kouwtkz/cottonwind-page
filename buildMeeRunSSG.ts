const { buildMeeSSG } = await import("./buildMeeSSG");
buildMeeSSG({ dir: "dist", src: "src/ssg" });

export { };