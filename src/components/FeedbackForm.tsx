import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonTextarea,
} from "@ionic/react";
import React, { useState } from "react";
import "./Components.css";
import emailjs from "emailjs-com";
import { decrypt } from "../utils/SecurityUtils";

/**
 * Feedback Screen.
 *
 * Uses EmailJS as a service to send emails.
 * This class will send actual emails when people have feedback.
 */
const FeedbackScreen: React.FC = () => {
  const ENCRYPTED_USER_ID =
    "U2FsdGVkX19ijiVnA6XtmJ4wa/RL9NngWwn4uKfq6gO+4ZI/V1F/RCYL4REfk0tZ";
  const PRIVATE_KEY = "jesus private key";
  const SERVICE_ID = "hymnal_app_service_id";
  const EMAIL_TEMPLATE = "template_z4z7bhi";

  const [fromWhom, setFromWhom] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [feedbackResponseText, setFeedbackResponseText] = useState<string>("");
  const [feedbackResponseModal, setShowFeedbackResponseModal] = useState<
    boolean
  >(false);

  emailjs.init(decrypt(ENCRYPTED_USER_ID, PRIVATE_KEY));

  return (
    <div id="feedbackFormDiv">
      <IonItem>
        <IonLabel position="floating">Name</IonLabel>
        <IonInput
          type="text"
          value={fromWhom}
          placeholder="Enter your name"
          onIonChange={(e) => setFromWhom(e.detail.value!)}
        ></IonInput>
      </IonItem>
      <IonItem>
        <IonLabel position="floating">What do you think?</IonLabel>
        <IonTextarea
          rows={7}
          value={message}
          placeholder="Enter feedback"
          onIonChange={(e) => setMessage(e.detail.value!)}
        ></IonTextarea>
      </IonItem>

      <IonButton expand="full" onClick={() => sendEmail()}>
        Submit Feedback
      </IonButton>

      <IonModal
        id="feedbackResponseModal"
        isOpen={feedbackResponseModal}
        onDidDismiss={() => clearResponseModal()}
      >
        <h1 className="center">{feedbackResponseText}</h1>
        <IonButton
          id="feedbackResponseOKButton"
          onClick={() => clearResponseModal()}
        >
          OK
        </IonButton>
      </IonModal>
    </div>
  );

  /**
   * Sends an email to the hymnal dev team when someone has feedback.
   */
  function sendEmail() {
    var templateParams = {
      from_name: fromWhom,
      message: message,
    };
    if (message === "" || fromWhom === "") {
      setFeedbackResponseText("Please tell us your name and feedback message!");
    } else {
      emailjs.send(SERVICE_ID, EMAIL_TEMPLATE, templateParams).then(
        function (response) {
          console.log(
            "Email sent successfully.",
            response.status,
            response.text
          );
          setFeedbackResponseText("Feedback Submitted Sucessfully, Thanks!");
        },
        function (error) {
          setFeedbackResponseText(`Error Submitting Feedback: ${error}`);
          console.log("Error sending email: ", error);
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
  }

  // Clears and hides Response modal.
  function clearResponseModal() {
    setFeedbackResponseText("");
    setShowFeedbackResponseModal(false);
  }
};

export default FeedbackScreen;
