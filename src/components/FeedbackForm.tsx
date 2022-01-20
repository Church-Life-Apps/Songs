import { IonButton, IonInput, IonItem, IonLabel, IonModal, IonTextarea } from "@ionic/react";
import React, { useState } from "react";
import "./Components.css";

import { decrypt } from "../utils/SecurityUtils";
import { Octokit } from "octokit";


/**
 * Feedback Screen.
 * Uses GitHub issues api to create issues directly in the Song repo.
 */
const FeedbackScreen: React.FC = () => {

  const PRIVATE_KEY = "jesus private key";
  // REPO_OWNER can be a github username or organization name
  const REPO_OWNER = "Church-Life-Apps";
  const REPO_NAME = "Songs";
  const ENCRYPTED_TOKEN = "U2FsdGVkX1+bPnD7qF/W1r3lCIYIwy88qJ1SO+d9HiCkYac2WeRs2MOpFHVq5TjdPNV0vrizHfRlMCgxInEAIQ==";

  // Sets up octokit (github api wrapper)
  const octokit = new Octokit({ auth: decrypt(ENCRYPTED_TOKEN, PRIVATE_KEY) });

  const [fromWhom, setFromWhom] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [feedbackResponseText, setFeedbackResponseText] = useState<string>("");
  const [feedbackResponseModal, setShowFeedbackResponseModal] = useState<boolean>(false);

  return (
    <div id="feedbackFormDiv">
      <IonItem>
        <IonLabel position="floating">Name (Optional)</IonLabel>
        <IonInput
          type="text"
          value={fromWhom}
          placeholder="Enter your name"
          onIonChange={(e) => setFromWhom(e.detail.value as string)}
        ></IonInput>
      </IonItem>

      <IonItem>
        <IonLabel position="floating">Subject/Title</IonLabel>
        <IonInput
          type="text"
          value={title}
          placeholder="Enter Subject/Title"
          onIonChange={(e) => setTitle(e.detail.value as string)}
        ></IonInput>
      </IonItem>

      <IonItem>
        <IonLabel position="floating">What do you think?</IonLabel>
        <IonTextarea
          rows={7}
          value={message}
          placeholder="Enter feedback"
          onIonChange={(e) => setMessage(e.detail.value as string)}
        ></IonTextarea>
      </IonItem>

      <IonButton expand="full" onClick={sendEmail}>
        Submit Feedback
      </IonButton>

      <IonModal id="feedbackResponseModal" isOpen={feedbackResponseModal} onDidDismiss={clearResponseModal}>
        <h1 className="center">{feedbackResponseText}</h1>
        <IonButton id="feedbackResponseOKButton" onClick={clearResponseModal}>
          OK
        </IonButton>
      </IonModal>
    </div>
  );

  /**
   * Creates a github issue with the feedback content.
   */
  function sendEmail() {

    if (title === "" || message === "") {
      setFeedbackResponseText("Please include a title/subject and a feedback message!");
    } else {
      
      // using octokit rest smaller bundle size
      const sentFromWhom = fromWhom || "anonymous";

      octokit.rest.issues.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: title,
        body: `> ${message}\n— ${sentFromWhom}`
      }).then(
        function (response) {
          console.debug("GitHub issue created successfully.", response.status, response.data.body);
          setFeedbackResponseText("Feedback Submitted Sucessfully, Thanks!");
        },
        function (error) {
          setFeedbackResponseText(`Error Submitting Feedback: ${error}`);
          console.error("Error making GitHub issue: ", error);
        }
      );
      clearForm();
    }
    setShowFeedbackResponseModal(true);
  }

  // Clears form fields.
  function clearForm() {
    setFromWhom("");
    setMessage("");
    setTitle("");
  }

  // Clears and hides Response modal.
  function clearResponseModal() {
    setFeedbackResponseText("");
    setShowFeedbackResponseModal(false);
  }
};

export default FeedbackScreen;
