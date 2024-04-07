// Post.js

import React, { useState, useEffect } from "react";
import { css } from "@emotion/css";
import { useParams } from "react-router-dom";
// import { API, Storage } from "aws-amplify";
import { getPost } from "./graphql/queries";
import { generateClient } from "aws-amplify/api";
import { getUrl } from "aws-amplify/storage";

export default function Post() {
  const [loading, updateLoading] = useState(true);
  const [post, updatePost] = useState(null);
  const client = generateClient();

  const { id } = useParams();
  useEffect(() => {
    fetchPost();
  }, []);

  const handleGetUrl = async (key) => {
    const url = await getUrl({
      key,
      options: {
        validateObjectExistence: true,
      },
    });
    return url.url.href;
  };
  async function fetchPost() {
    try {
      const postData = await client.graphql({
        query: getPost,
        variables: { id },
      });
      const currentPost = postData.data.getPost;
      const image = await handleGetUrl(currentPost.image);
      currentPost.image = image;
      updatePost(currentPost);
      updateLoading(false);
    } catch (err) {
      console.log("error: ", err);
    }
  }
  if (loading) return <h3>Loading...</h3>;
  return (
    <>
      <h1 className={titleStyle}>{post.name}</h1>
      <h3 className={locationStyle}>{post.location}</h3>
      <p>{post.description}</p>
      <img alt="post" src={post.image} className={imageStyle} />
    </>
  );
}

const titleStyle = css`
  margin-bottom: 7px;
`;

const locationStyle = css`
  color: #0070f3;
  margin: 0;
`;

const imageStyle = css`
  max-width: 500px;
  @media (max-width: 500px) {
    width: 100%;
  }
`;
