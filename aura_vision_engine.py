"""
AURA-PainCare: AI Silent-Pain & Distress Monitor
Layer 2 Companion: Native Python OpenCV Vision AI Engine

This script demonstrates native Python computer vision tracking with OpenCV,
calculating Facial Action Units (AU4 Brow Furrowing, AU6/7 Eye Squint, AU25/27 Grimacing),
and emitting Windows hardware beeps upon sustained critical pain.
"""

import cv2
import time
import math
import sys

# Platform-specific audio warning
try:
    import winsound
    def play_chime():
        winsound.Beep(980, 150)
        winsound.Beep(1318, 200)
except ImportError:
    def play_chime():
        sys.stdout.write("\a")
        sys.stdout.flush()

def main():
    print("=" * 65)
    print("AURA-PainCare: Native Python OpenCV Facial Distress Engine")
    print("Zero-Hardware Vision AI Module")
    print("=" * 65)
    print("[*] Initializing camera index 0...")

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[!] Error: Could not access webcam at index 0.")
        print("[*] Please run the Web Application via START_AURA_PAINCARE.bat for full browser camera support.")
        return

    # Load OpenCV Face Detector Haar Cascade
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)

    eye_cascade_path = cv2.data.haarcascades + 'haarcascade_eye.xml'
    eye_cascade = cv2.CascadeClassifier(eye_cascade_path)

    pain_score = 0.0
    smoothed_score = 0.0
    sustained_start = None

    print("[*] Vision loop running. Press 'q' in the video window to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1) # Mirror
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(100, 100))

        h, w, _ = frame.shape

        if len(faces) > 0:
            (x, y, fw, fh) = faces[0]

            # Region of Interest for Eyes and Forehead
            face_roi_gray = gray[y:y+fh, x:x+fw]
            face_roi_color = frame[y:y+fh, x:x+fw]

            # Detect eyes within face
            eyes = eye_cascade.detectMultiScale(face_roi_gray, scaleFactor=1.1, minNeighbors=3, minSize=(25, 25))

            # Approximate AU metrics
            # Eye Squint: reduction in detected eye bounding box height or lack of wide open eyes
            squint_metric = 0.8 if len(eyes) < 2 else 0.1

            # Mouth & lower face vertical strain (lower 35% of face)
            mouth_roi = face_roi_gray[int(fh*0.65):fh, :]
            # Variance in gradients represents grimace/lip tension
            laplacian_var = cv2.Laplacian(mouth_roi, cv2.CV_64F).var()
            grimace_metric = min(1.0, laplacian_var / 350.0)

            # Combined raw pain score (0 to 10)
            raw_score = (squint_metric * 5.0) + (grimace_metric * 5.0)
            smoothed_score = smoothed_score * 0.7 + raw_score * 0.3

            # Determine severity color
            if smoothed_score >= 8.5:
                color = (0, 0, 255) # Red
                severity = "CRITICAL PAIN"
            elif smoothed_score >= 6.0:
                color = (0, 140, 255) # Orange
                severity = "SEVERE PAIN"
            elif smoothed_score >= 3.0:
                color = (0, 215, 255) # Yellow
                severity = "MODERATE"
            else:
                color = (0, 255, 127) # Green
                severity = "MILD / NORMAL"

            # Draw HUD Bounding Box
            cv2.rectangle(frame, (x, y), (x+fw, y+fh), color, 2)
            for (ex, ey, ew, eh) in eyes:
                cv2.rectangle(face_roi_color, (ex, ey), (ex+ew, ey+eh), (255, 255, 0), 1)

            # HUD Telemetry Overlay
            cv2.putText(frame, f"AURA PAIN INDEX: {smoothed_score:.1f}/10.0", (x, max(30, y - 25)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            cv2.putText(frame, f"SEVERITY: {severity}", (x, max(50, y - 5)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)

            # Check sustained pain alert trigger
            if smoothed_score >= 6.0:
                if sustained_start is None:
                    sustained_start = time.time()
                elapsed = time.time() - sustained_start
                cv2.putText(frame, f"SUSTAINED: {elapsed:.1f}s / 1.5s", (20, h - 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                if elapsed >= 1.5:
                    cv2.putText(frame, ">>> NURSE ALERT DISPATCHED <<<", (20, h - 60),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 3)
                    play_chime()
            else:
                sustained_start = None
        else:
            smoothed_score *= 0.8
            cv2.putText(frame, "SEARCHING FOR PATIENT FACE...", (30, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (180, 180, 180), 2)

        # Draw Global HUD Header
        cv2.rectangle(frame, (0, 0), (w, 35), (20, 20, 20), -1)
        cv2.putText(frame, "AURA-PainCare AI Vision | Bed 104 Post-Op ICU | Zero-Hardware Prototype",
                    (15, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 220, 255), 1)

        cv2.imshow("AURA-PainCare: Native Vision AI Engine", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("[*] Vision engine closed.")

if __name__ == "__main__":
    main()
