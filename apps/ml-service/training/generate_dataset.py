import numpy as np
import pandas as pd
import os

def generate_synthetic_academic_dataset(num_samples: int = 2000, seed: int = 42, output_path: str = "data/student_performance_data.csv"):
    np.random.seed(seed)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # 1. Attendance (0 - 100%) - slightly skewed towards higher attendance
    attendance = np.random.beta(a=5, b=2, size=num_samples) * 100
    attendance = np.clip(attendance, 15.0, 100.0)

    # 2. Previous Academic Score (0 - 100) - normal distribution
    previous_score = np.random.normal(loc=68.0, scale=14.0, size=num_samples)
    previous_score = np.clip(previous_score, 20.0, 98.0)

    # 3. Weekly Self-Study Hours (0 - 40 hrs) - log-normal
    study_hours = np.random.lognormal(mean=2.1, sigma=0.45, size=num_samples)
    study_hours = np.clip(study_hours, 1.0, 36.0)

    # 4. Assignment Completion Rate (0 - 100%) - correlated with attendance & study hours
    assignment_latent = 0.5 * (attendance / 100.0) + 0.3 * (study_hours / 30.0) + 0.2 * np.random.uniform(0.3, 1.0, size=num_samples)
    assignment_completion = np.clip(assignment_latent * 100.0 + np.random.normal(0, 5, num_samples), 10.0, 100.0)

    # 5. Internal Marks (0 - 100) - correlated with past score, attendance, and assignments
    internal_latent = 0.4 * previous_score + 0.3 * attendance + 0.2 * assignment_completion + 0.1 * (study_hours * 2.5)
    internal_marks = np.clip(internal_latent + np.random.normal(0, 4.5, num_samples), 15.0, 98.0)

    # 6. Participation / Engagement (0 - 100%)
    participation_latent = 0.6 * (attendance / 100.0) + 0.4 * np.random.uniform(0.2, 1.0, size=num_samples)
    participation = np.clip(participation_latent * 100.0 + np.random.normal(0, 6, num_samples), 10.0, 100.0)

    # Target: Final Examination Score (0 - 100)
    # Realistic educational model:
    # 25% Internal Continuous Assessment
    # 22% Previous Foundational Score
    # 20% Lecture/Lab Attendance
    # 15% Assignment Mastery
    # 12% Independent Study Hours (scaled)
    # 6% Active Classroom Participation
    # + Realistic Exam Variance (-4 to +4)
    raw_final = (
        0.26 * internal_marks +
        0.23 * previous_score +
        0.20 * attendance +
        0.15 * assignment_completion +
        0.10 * np.minimum(study_hours * 3.0, 100.0) +
        0.06 * participation +
        np.random.normal(0, 3.5, size=num_samples)
    )
    final_score = np.clip(raw_final, 10.0, 99.5)

    df = pd.DataFrame({
        "attendance": np.round(attendance, 1),
        "previousScore": np.round(previous_score, 1),
        "internalMarks": np.round(internal_marks, 1),
        "assignmentCompletion": np.round(assignment_completion, 1),
        "studyHours": np.round(study_hours, 1),
        "participation": np.round(participation, 1),
        "finalScore": np.round(final_score, 1)
    })

    df.to_csv(output_path, index=False)
    print(f"[Dataset Generator] Generated {num_samples} academic samples at {output_path}")
    print(df.describe().round(2))
    return df

if __name__ == "__main__":
    generate_synthetic_academic_dataset()
