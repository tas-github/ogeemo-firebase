
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { v1 } from "@google-cloud/firestore";

// Initialize the Firebase Admin SDK
admin.initializeApp();

const firestoreClient = new v1.FirestoreAdminClient();

/**
 * Initiates a backup of the Firestore database.
 *
 * This function is callable from the client-side application and will
 * start an export of the entire Firestore database to a Google Cloud
 * Storage bucket.
 */
export const triggerBackup = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Get the project ID from the environment.
  const projectId = process.env.GCP_PROJECT;
  if (!projectId) {
    throw new functions.https.HttpsError(
      "internal",
      "GCP_PROJECT environment variable not set."
    );
  }
  
  // The Google Cloud Storage bucket to export to.
  // IMPORTANT: The format is 'gs://[YOUR_BUCKET_NAME]'
  const bucket = `gs://${projectId}-backups`;

  const request = {
    name: firestoreClient.databasePath(projectId, "(default)"),
    outputUriPrefix: bucket,
    // Leave collectionIds empty to export all collections
    collectionIds: [],
  };

  try {
    const [response] = await firestoreClient.exportDocuments(request);
    console.log(`Operation name: ${response.name}`);
    return {
      message: "Backup successfully initiated.",
      operationName: response.name,
    };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while initiating the backup.",
      error
    );
  }
});

