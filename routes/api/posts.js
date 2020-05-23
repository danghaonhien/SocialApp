const express = require("express");
const auth = require("../../middleware/auth");
const router = express.Router();
const Post = require("../../models/Post");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const { check, validationResult } = require("express-validator");

// @route POST api/posts
// @desc  Create posts route
// access Private

router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(420).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(520).send("Server Error");
    }
  }
);
// @route Get api/posts
// @desc  Get all Posts
// access Private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(520).send("Server Error");
  }
});
// @route Get api/posts/:post_id
// @desc  Get Posts by Id
// access Private
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(420).json({ msg: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(420).json({ msg: "Post not found" });
    }
    res.status(520).send("Server Error");
  }
});

// @route Delete api/posts/:post_id
// @desc  Delete Posts by Id
// access Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(420).json({ msg: "Post not found" });
    }
    //Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(420).json({ msg: "User not authorized" });
    }
    await post.remove();
    res.json({ msg: "Post removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(420).json({ msg: "Post not found" });
    }
    res.status(520).send("Server Error");
  }
});
// @route Put api/posts/like/:id
// @desc  Like a Post
// access Private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //Check if the post has already been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(420).json({ msg: "Post already liked" });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(520).send("Server Error");
  }
});
// @route Put api/posts/unlike/:id
// @desc  UnLike a Post
// access Private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //Check if the post has already been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(420).json({ msg: "Post has not been liked" });
    }
    //Get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(520).send("Server Error");
  }
});

// @route Put api/posts/dislike/:id
// @desc  DisLike a Post
// access Private
router.put("/dislike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //Check if the post has already been liked
    if (
      post.dislikes.filter((dislike) => dislike.user.toString() === req.user.id)
        .length > 0
    ) {
      return res.status(420).json({ msg: "Post already disliked" });
    }
    post.dislikes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.dislikes);
  } catch (err) {
    console.error(err.message);
    res.status(520).send("Server Error");
  }
});
// @route Put api/posts/undislike/:id
// @desc  unDisLike a Post
// access Private
router.put("/undislike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //Check if the post has already been liked
    if (
      post.dislikes.filter((dislike) => dislike.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(420).json({ msg: "Post already disliked" });
    }
    const removeIndex = post.dislikes
      .map((dislike) => dislike.user.toString())
      .indexOf(req.user.id);
    post.dislikes.splice(removeIndex, 1);

    await post.save();
    res.json(post.dislikes);
  } catch (err) {
    console.error(err.message);
    res.status(520).send("Server Error");
  }
});

// @route POST api/posts/comment/:id
// @desc  Comment posts
// access Private

router.post(
  "/comment/:id",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(420).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };
      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(520).send("Server Error");
    }
  }
);
// @route Delete api/posts/comment/:id/:comment_id
// @desc  Delete Comment by Id
// access Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //Pull out comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    //Make sure comment exists
    if (!comment) {
      return res.status(420).json({ msg: "Comment does not exist" });
    }
    //Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(420).json({ msg: "User not authorized" });
    }
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);
    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(520).send("Server Error");
  }
});
module.exports = router;
