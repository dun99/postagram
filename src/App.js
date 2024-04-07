// src/App.js
import React, { useEffect, useState } from "react";

// import API from Amplify library
// import { API } from "aws-amplify";

import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
// import { API } from "aws-amplify";
import { generateClient } from "aws-amplify/api";

// import query definition
import { listPosts } from "./graphql/queries";

import Button from "./Button";
import CreatePost from "./CreatePost";
import Header from "./Header";
import Post from "./Post";
import Posts from "./Posts";

import "@aws-amplify/ui-react/styles.css";
import { css } from "@emotion/css";
// import { API, Storage } from "aws-amplify";
import { HashRouter, Route, Switch } from "react-router-dom";
import { getUrl } from "aws-amplify/storage";

function Router({ user, signOut }) {
  /* create a couple of pieces of initial state */
  const [showOverlay, updateOverlayVisibility] = useState(false);
  const [posts, updatePosts] = useState([]);
  const client = generateClient();

  const [myPosts, updateMyPosts] = useState([]);

  // async function setPostState(postsArray) {
  //   const myPostData = postsArray.filter((p) => p.owner === user.username);
  //   updateMyPosts(myPostData);
  //   updatePosts(postsArray);
  // }

  /* fetch posts when component loads */
  useEffect(() => {
    fetchPosts();
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

  async function fetchPosts() {
    /* query the API, ask for 100 items */
    let postData = await client.graphql({
      query: listPosts,
      variables: { limit: 100 },
    });
    let postsArray = postData.data.listPosts.items;
    setPostState(postsArray);

    /* map over the image keys in the posts array, get signed image URLs for each image */
    postsArray = await Promise.all(
      postsArray.map(async (post) => {
        if (post.image) {
          // const imageKey = await handleGetUrl(post.image);

          try {
            const imageURL = await handleGetUrl(post.image);
            post.image = imageURL;
            return post;
          } catch (error) {
            if (error.code === "NotFound") {
              console.error("Image not found for post:", post.id);
              // Handle the NotFound error, e.g., show a placeholder image
              // post.image = 'path/to/placeholder-image.jpg';
            } else {
              console.error(
                "Error fetching image URL for post:",
                post.id,
                error
              );
            }
            return post;
          }
          // console.log("imageKey", imageKey);
          // post.image = imageKey;
          // return post;
        }
      })
    );

    /* update the posts array in the local state */
    setPostState(postsArray);
  }

  async function setPostState(postsArray) {
    const myPostData = postsArray.filter((p) => p.owner === user.username);
    updateMyPosts(myPostData);
    updatePosts(postsArray);
  }

  return (
    <>
      <HashRouter>
        <div className={contentStyle}>
          <Header />
          <hr className={dividerStyle} />
          <Button
            title="New Post"
            onClick={() => updateOverlayVisibility(true)}
          />
          <Switch>
            <Route exact path="/">
              <Posts posts={posts} />
            </Route>
            <Route path="/post/:id">
              <Post />
            </Route>
            <Route exact path="/myposts">
              <Posts posts={myPosts} />
            </Route>
          </Switch>
        </div>
        <button onClick={signOut}>Sign out</button>
      </HashRouter>
      {showOverlay && (
        <CreatePost
          updateOverlayVisibility={updateOverlayVisibility}
          updatePosts={setPostState}
          posts={posts}
          user={user}
        />
      )}
    </>
  );
}

const dividerStyle = css`
  margin-top: 15px;
`;

const contentStyle = css`
  min-height: calc(100vh - 45px);
  padding: 0px 40px;
`;

export default withAuthenticator(Router);
