// CreatePost.js

import React, { useState } from "react";
import { css } from "@emotion/css";
import Button from "./Button";
import { v4 as uuid } from "uuid";
// import { Storage, API, Auth } from "aws-amplify";
import { createPost } from "./graphql/mutations";
import { generateClient } from "aws-amplify/api";
import { uploadData } from "aws-amplify/storage";
/* Initial state to hold form input, saving state */
const initialState = {
  name: "",
  description: "",
  image: {},
  file: "",
  location: "",
  saving: false,
};

export default function CreatePost({
  updateOverlayVisibility,
  updatePosts,
  posts,
  user,
}) {
  /* 1. Create local state with useState hook */
  const [formState, updateFormState] = useState(initialState);
  const client = generateClient();

  /* 2. onChangeText handler updates the form state when a user types into a form field */
  function onChangeText(e) {
    e.persist();
    updateFormState((currentState) => ({
      ...currentState,
      [e.target.name]: e.target.value,
    }));
  }

  console.log("user", user);

  /* 3. onChangeFile handler will be fired when a user uploads a file  */
  function onChangeFile(e) {
    e.persist();
    if (!e.target.files[0]) return;
    const fileExtPosition = e.target.files[0].name.search(/.png|.jpg|.gif/i);
    const firstHalf = e.target.files[0].name.slice(0, fileExtPosition);
    const secondHalf = e.target.files[0].name.slice(fileExtPosition);
    const fileName = firstHalf + "_" + uuid() + secondHalf;
    console.log(fileName);
    const image = { fileInfo: e.target.files[0], name: fileName };
    updateFormState((currentState) => ({
      ...currentState,
      file: URL.createObjectURL(e.target.files[0]),
      image,
    }));
  }

  const handleUpload = async (key, data) => {
    // Upload a file with access level `guest` as  the equivalent of `public` in v5
    const operation = uploadData({
      key,
      data,
      options: {
        accessLevel: "guest",
      },
    });

    const result = await operation.result;
  };

  /* 4. Save the post  */
  async function save() {
    try {
      const { name, description, location, image } = formState;
      if (!name || !description || !location || !image.name) return;
      updateFormState((currentState) => ({ ...currentState, saving: true }));
      const postId = uuid();
      const postInfo = {
        name,
        description,
        location,
        image: formState.image.name,
        id: postId,
      };

      const result = handleUpload(
        formState.image.name,
        formState.image.fileInfo
      );
      // await uploadData(formState.image.name, formState.image.fileInfo);
      console.log("result", result);
      await client.graphql({
        query: createPost,
        variables: { input: postInfo },
        authMode: "userPool",
      });
      updatePosts([
        ...posts,
        { ...postInfo, image: formState.file, owner: user.username },
      ]); // updated
      // updatePosts([...posts, { ...postInfo, image: formState.file }]);
      updateFormState((currentState) => ({ ...currentState, saving: false }));
      updateOverlayVisibility(false);
    } catch (err) {
      console.log("error: ", err);
    }
  }

  return (
    <div className={containerStyle}>
      <input
        placeholder="Post name"
        name="name"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input
        placeholder="Location"
        name="location"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input
        placeholder="Description"
        name="description"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input type="file" onChange={onChangeFile} />
      {formState.file && (
        <img className={imageStyle} alt="preview" src={formState.file} />
      )}
      <Button title="Create New Post" onClick={save} />
      <Button
        type="cancel"
        title="Cancel"
        onClick={() => updateOverlayVisibility(false)}
      />
      {formState.saving && <p className={savingMessageStyle}>Saving post...</p>}
    </div>
  );
}

const inputStyle = css`
  margin-bottom: 10px;
  outline: none;
  padding: 7px;
  border: 1px solid #ddd;
  font-size: 16px;
  border-radius: 4px;
`;

const imageStyle = css`
  height: 120px;
  margin: 10px 0px;
  object-fit: contain;
`;

const containerStyle = css`
  display: flex;
  flex-direction: column;
  width: 400px;
  height: 420px;
  position: fixed;
  left: 0;
  border-radius: 4px;
  top: 0;
  margin-left: calc(50vw - 220px);
  margin-top: calc(50vh - 230px);
  background-color: white;
  border: 1px solid #ddd;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 0.125rem 0.25rem;
  padding: 20px;
`;

const savingMessageStyle = css`
  margin-bottom: 0px;
`;
