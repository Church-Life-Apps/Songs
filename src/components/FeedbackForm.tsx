import { IonButton, IonInput, IonItem, IonLabel, IonModal, IonTextarea } from "@ionic/react";
import React, { useState } from "react";
import "./Components.css";

import { decrypt } from "../utils/SecurityUtils";
import { Octokit } from "@octokit/rest";

/**
 * Feedback Screen.
 * Uses GitHub issues api to create issues directly in the Song repo.
 */
const FeedbackScreen: React.FC = () => {
  const PRIVATE_KEY = "jesus private key";
  // REPO_OWNER can be a github username or organization name
  const REPO_OWNER = "Church-Life-Apps";
  const REPO_NAME = "Songs";
  const ENCRYPTED_TOKEN = "U2FsdGVkX19FFsXAn9Kqoh6Em094OusaL4jRCigm6C3eVbW4MlplenL/tOvNRZb5cjG5ahkV4ZGcmAGvPbTmaB0CZO2TqCDkJsxMQyt0eBbxTLl+tqlgv6/VytHtPt6XcaIV/eDyuNPLGJfDYXM1qA==";

  // Sets up octokit (github api wrapper)
  const octokit = new Octokit({ auth: decrypt(ENCRYPTED_TOKEN, PRIVATE_KEY) });

  const [fromWhom, setFromWhom] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [feedbackResponseText, setFeedbackResponseText] = useState<string>("");
  const [feedbackResponseModal, setShowFeedbackResponseModal] = useState<boolean>(false);

  /**
   * Reads the current songbook + song from the hash route, if any.
   * The app uses HashRouter with routes like "/<bookId>/<songId>" so the hash
   * looks like "#/sfog/12". Returns undefined for either field if not in a
   * song-scoped route (e.g. when feedback is opened from a non-song page).
   */
  function getRouteContext(): { bookId?: string; songId?: string } {
    if (typeof window === "undefined" || !window.location) return {};
    const hash = window.location.hash || "";
    // strip leading "#" and any leading slashes, then split on "/"
    const parts = hash.replace(/^#\/?/, "").split("/").filter(p => p.length > 0);
    if (parts.length >= 2) {
      return { bookId: parts[0], songId: parts[1] };
    }
    if (parts.length === 1) {
      return { bookId: parts[0] };
    }
    return {};
  }

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

      <IonButton expand="full" onClick={createGithubIssue}>
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
  function createGithubIssue() {
    if (title === "" || message === "") {
      setFeedbackResponseText("Please include a title/subject and a feedback message!");
    } else {
      // using octokit rest smaller bundle size
      const sentFromWhom = fromWhom || "anonymous";
      const { bookId, songId } = getRouteContext();
      const ctxPrefix = bookId && songId ? `[${bookId}/${songId}] ` : bookId ? `[${bookId}] ` : "";
      const ctxFooter =
        bookId || songId
          ? `\n\n_Reported from: ${bookId || "—"} song ${songId || "—"}_`
          : "";

      octokit.rest.issues
        .create({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          title: `${ctxPrefix}${title}`,
          body: `> ${message}\n\n— ${sentFromWhom}${ctxFooter}`,
        })
        .then(
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
