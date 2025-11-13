function escapeHtml(value) {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPrescriptionHtml({
  patientName,
  patientRollNo,
  doctorName,
  appointmentDate,
  diagnosis,
  medications,
  dosage,
  advice,
  followUpDate,
}) {
  return `
  <div style="font-family: Arial, sans-serif; max-width:700px; margin:0 auto;">
    <h2 style="margin:0 0 8px 0;">Prescription</h2>
    <div style="color:#555; font-size:13px; margin-bottom:12px;">NITC Health Centre</div>
    <hr/>
    <div style="margin:12px 0; font-size:14px;">
      <div><strong>Patient:</strong> ${escapeHtml(patientName)} ${
    patientRollNo ? `(${escapeHtml(patientRollNo)})` : ""
  }</div>
      <div><strong>Doctor:</strong> Dr. ${escapeHtml(doctorName)}</div>
      <div><strong>Date:</strong> ${escapeHtml(appointmentDate)}</div>
    </div>
    ${
      diagnosis
        ? `<div style="margin:8px 0;"><strong>Diagnosis:</strong> ${escapeHtml(
            diagnosis
          )}</div>`
        : ""
    }
    ${
      medications
        ? `<div style="margin:8px 0;"><strong>Medications:</strong><br/>${escapeHtml(
            medications
          ).replace(/\n/g, "<br/>")}</div>`
        : ""
    }
    ${
      dosage
        ? `<div style="margin:8px 0;"><strong>Dosage:</strong><br/>${escapeHtml(
            dosage
          ).replace(/\n/g, "<br/>")}</div>`
        : ""
    }
    ${
      advice
        ? `<div style="margin:8px 0;"><strong>Advice:</strong><br/>${escapeHtml(
            advice
          ).replace(/\n/g, "<br/>")}</div>`
        : ""
    }
    ${
      followUpDate
        ? `<div style="margin:8px 0;"><strong>Follow-up:</strong> ${escapeHtml(
            followUpDate
          )}</div>`
        : ""
    }
    <hr/>
    <div style="margin-top:16px; font-size:12px; color:#666;">This prescription is generated electronically after consultation.</div>
  </div>`;
}

function renderMedicalCertificateHtml({
  patientName,
  patientRollNo,
  doctorName,
  issueDate,
  diagnosis,
  restFrom,
  restTo,
  fitFrom,
}) {
  return `
  <div style="font-family: Arial, sans-serif; max-width:700px; margin:0 auto;">
    <h2 style="margin:0 0 8px 0;">Medical Certificate</h2>
    <div style="color:#555; font-size:13px; margin-bottom:12px;">NITC Health Centre</div>
    <hr/>
    <div style="margin:12px 0; font-size:14px;">
      <div><strong>Patient:</strong> ${escapeHtml(patientName)} ${
    patientRollNo ? `(${escapeHtml(patientRollNo)})` : ""
  }</div>
      <div><strong>Issued on:</strong> ${escapeHtml(issueDate)}</div>
      ${
        diagnosis
          ? `<div style="margin:8px 0;"><strong>Condition:</strong> ${escapeHtml(
              diagnosis
            )}</div>`
          : ""
      }
      ${
        restFrom || restTo
          ? `<div style="margin:8px 0;"><strong>Rest advised:</strong> ${escapeHtml(
              restFrom || ""
            )} ${restTo ? `to ${escapeHtml(restTo)}` : ""}</div>`
          : ""
      }
      ${
        fitFrom
          ? `<div style="margin:8px 0;"><strong>Fit for duty from:</strong> ${escapeHtml(
              fitFrom
            )}</div>`
          : ""
      }
    </div>
    <div style="margin-top:20px;">
      <div><strong>Doctor:</strong> Dr. ${escapeHtml(doctorName)}</div>
      <div style="margin-top:40px;">______________________________<br/>Signature</div>
    </div>
    <hr/>
    <div style="margin-top:16px; font-size:12px; color:#666;">This certificate is valid only after staff verification.</div>
  </div>`;
}

module.exports = {
  renderPrescriptionHtml,
  renderMedicalCertificateHtml,
};









