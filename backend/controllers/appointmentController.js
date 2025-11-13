const Appointment = require("../models/Appointment");
const User = require("../models/User");
const DoctorAvailability = require("../models/DoctorAvailability");
const { sendAppointmentConfirmation, sendEmail } = require("../utils/email");
const {
  renderPrescriptionHtml,
  renderMedicalCertificateHtml,
} = require("../utils/templates");

/* ------------------------ BOOK APPOINTMENT ------------------------ */
exports.bookAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      appointmentType,
      purpose,
      symptoms,
      priority,
    } = req.body;

    // Validate required fields
    if (!doctorId || !appointmentDate || !appointmentTime || !purpose) {
      return res.status(400).json({
        message: "Doctor, date, time, and purpose are required",
      });
    }

    // Get patient details
    const patient = await User.findById(userId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Get doctor details
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Validate against doctor's weekly availability
    const targetDate = new Date(appointmentDate);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const dayAvailability = await DoctorAvailability.findOne({
      doctorId,
      dayOfWeek,
      isActive: true,
    });

    if (!dayAvailability || dayAvailability.timeSlots.length === 0) {
      return res.status(400).json({
        message: "Doctor is not available on this day",
      });
    }

    // Check if the requested time slot is in doctor's available slots
    if (!dayAvailability.timeSlots.includes(appointmentTime)) {
      return res.status(400).json({
        message:
          "This time slot is not available. Please select from available slots.",
        availableSlots: dayAvailability.timeSlots,
      });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: targetDate,
      appointmentTime,
      status: { $in: ["scheduled", "confirmed", "in-progress"] },
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        message: "This time slot is already booked",
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patientId: userId,
      patientName: patient.name,
      patientEmail: patient.email,
      patientPhone: patient.phoneNumber,
      healthCardId: patient.healthCardId,
      doctorId,
      doctorName: doctor.name,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      appointmentType: appointmentType || "consultation",
      purpose,
      symptoms,
      priority: priority || "medium",
      createdBy: userId,
    });

    await appointment.save();

    // Send confirmation email (non-blocking)
    try {
      if (patient.email) {
        sendAppointmentConfirmation({
          patientEmail: patient.email,
          patientName: patient.name,
          doctorName: doctor.name,
          appointmentDate,
          appointmentTime,
          purpose,
        }).catch(() => {});
      }
    } catch (_) {}

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: {
        id: appointment._id,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        doctorName: appointment.doctorName,
        purpose: appointment.purpose,
        status: appointment.status,
      },
    });
  } catch (error) {
    console.error("Book appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ GET PATIENT APPOINTMENTS ------------------------ */
exports.getPatientAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 10, page = 1 } = req.query;

    const query = { patientId: userId };
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate("doctorId", "name email")
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get patient appointments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ GET DOCTOR APPOINTMENTS ------------------------ */
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { date, status, limit = 20, page = 1 } = req.query;

    const query = { doctorId };
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.appointmentDate = {
        $gte: targetDate,
        $lt: nextDay,
      };
    }
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate("patientId", "name email phoneNumber healthCardId")
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get doctor appointments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ GET ALL APPOINTMENTS (ADMIN/STAFF) ------------------------ */
exports.getAllAppointments = async (req, res) => {
  try {
    const { status, doctorId, date, limit = 20, page = 1 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (doctorId) query.doctorId = doctorId;
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.appointmentDate = {
        $gte: targetDate,
        $lt: nextDay,
      };
    }

    const appointments = await Appointment.find(query)
      .populate("patientId", "name email phoneNumber healthCardId")
      .populate("doctorId", "name email")
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get all appointments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ UPDATE APPOINTMENT STATUS ------------------------ */
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const {
      status,
      doctorNotes,
      prescription,
      diagnosis,
      followUpRequired,
      followUpDate,
    } = req.body;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check permissions
    if (
      req.user.role === "nitcian" &&
      appointment.patientId.toString() !== userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (
      req.user.role === "doctor" &&
      appointment.doctorId.toString() !== userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update appointment
    if (status) appointment.status = status;
    if (doctorNotes) appointment.doctorNotes = doctorNotes;
    if (prescription) appointment.prescription = prescription;
    if (diagnosis) appointment.diagnosis = diagnosis;
    if (followUpRequired !== undefined)
      appointment.followUpRequired = followUpRequired;
    if (followUpDate) appointment.followUpDate = new Date(followUpDate);

    await appointment.save();

    res.json({
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    console.error("Update appointment status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ CANCEL APPOINTMENT ------------------------ */
exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check permissions
    if (
      req.user.role === "nitcian" &&
      appointment.patientId.toString() !== userId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if appointment can be cancelled
    if (["completed", "cancelled"].includes(appointment.status)) {
      return res.status(400).json({
        message: "Appointment cannot be cancelled",
      });
    }

    appointment.status = "cancelled";
    appointment.cancelledBy = userId;
    appointment.cancellationReason = cancellationReason;

    await appointment.save();

    res.json({
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ GET AVAILABLE TIME SLOTS ------------------------ */
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        message: "Doctor ID and date are required",
      });
    }

    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Get doctor's availability for this day of week
    const dayAvailability = await DoctorAvailability.findOne({
      doctorId,
      dayOfWeek,
      isActive: true,
    });

    if (!dayAvailability || dayAvailability.timeSlots.length === 0) {
      return res.json({
        date: targetDate.toISOString().split("T")[0],
        doctorId,
        doctorName: doctor.name,
        availableSlots: [],
        message: "Doctor not available on this day",
      });
    }

    // Get booked appointments for the day
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: {
        $gte: targetDate,
        $lt: nextDay,
      },
      status: { $in: ["scheduled", "confirmed", "in-progress"] },
    }).select("appointmentTime");

    const bookedTimes = bookedAppointments.map((apt) => apt.appointmentTime);

    // Filter available slots (only show slots that are in doctor's schedule and not booked)
    const availableSlots = dayAvailability.timeSlots.filter(
      (slot) => !bookedTimes.includes(slot)
    );

    res.json({
      date: targetDate.toISOString().split("T")[0],
      doctorId,
      doctorName: doctor.name,
      availableSlots,
      totalSlots: dayAvailability.timeSlots.length,
      bookedSlots: bookedTimes.length,
    });
  } catch (error) {
    console.error("Get available time slots error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ GET DOCTORS LIST ------------------------ */
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" })
      .select("_id name email")
      .sort({ name: 1 });

    res.json({ doctors });
  } catch (error) {
    console.error("Get doctors error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ GET PATIENT CONSULTATIONS (COMPLETED) ------------------------ */
exports.getPatientConsultations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, page = 1 } = req.query;

    const query = {
      patientId: userId,
      status: "completed",
    };

    const consultations = await Appointment.find(query)
      .populate("doctorId", "name email")
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.json({
      consultations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get patient consultations error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ DOCTOR: SUBMIT PRESCRIPTION DRAFT ------------------------ */
exports.submitPrescriptionDraft = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { appointmentId } = req.params;
    const { diagnosis, medications, dosage, advice, followUpDate } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });
    if (String(appointment.doctorId) !== String(doctorId)) {
      return res.status(403).json({ message: "Not your appointment" });
    }

    const apptDateStr = new Date(
      appointment.appointmentDate
    ).toLocaleDateString();
    const html = renderPrescriptionHtml({
      patientName: appointment.patientName,
      patientRollNo: appointment.healthCardId,
      doctorName: appointment.doctorName,
      appointmentDate: apptDateStr,
      diagnosis,
      medications,
      dosage,
      advice,
      followUpDate,
    });

    appointment.diagnosis = diagnosis || appointment.diagnosis;
    appointment.prescription = medications || appointment.prescription;
    appointment.followUpDate = followUpDate || appointment.followUpDate;
    appointment.prescriptionHtml = html;
    await appointment.save();

    // Notify staff for verification
    try {
      const staffEmails = await User.find({ role: "staff" }).distinct("email");
      if (staffEmails.length) {
        await sendEmail({
          to: staffEmails,
          subject: "Prescription Verification Required",
          html: `<p>New prescription draft submitted for ${appointment.patientName}. Please verify and upload.</p>`,
        });
      }
    } catch (_) {}

    res.json({ message: "Prescription draft submitted", html });
  } catch (error) {
    console.error("Submit prescription draft error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ STAFF: APPROVE/UPLOAD PRESCRIPTION ------------------------ */
exports.staffApprovePrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { prescriptionFileUrl } = req.body;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    appointment.prescriptionFile =
      prescriptionFileUrl || appointment.prescriptionFile;
    await appointment.save();

    // Notify patient
    try {
      if (appointment.patientEmail) {
        await sendEmail({
          to: appointment.patientEmail,
          subject: "Your Prescription is Ready",
          html: `<p>Your prescription for the visit with Dr. ${
            appointment.doctorName
          } is ready.</p>
                 ${
                   appointment.prescriptionFile
                     ? `<p><a href="${appointment.prescriptionFile}">Download Prescription</a></p>`
                     : ""
                 }`,
        });
      }
    } catch (_) {}

    res.json({ message: "Prescription approved and uploaded" });
  } catch (error) {
    console.error("Staff approve prescription error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ DOCTOR: SUBMIT CERTIFICATE DRAFT ------------------------ */
exports.submitCertificateDraft = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { appointmentId } = req.params;
    const { diagnosis, restFrom, restTo, fitFrom, generatedCertificateFile } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });
    if (String(appointment.doctorId) !== String(doctorId)) {
      return res.status(403).json({ message: "Not your appointment" });
    }

    appointment.certificateRequested = true;
    appointment.certificateRequestedAt = new Date();
    
    let html = null;
    
    // If doctor generated a certificate file, store it directly
    if (generatedCertificateFile) {
      appointment.certificateFile = generatedCertificateFile;
      appointment.certificateDraftGenerated = true;
      appointment.certificateDraftGeneratedAt = new Date();
      // Don't generate HTML when doctor has already generated the certificate image
      appointment.certificateDraftHtml = null;
    } else {
      // Only generate HTML draft if no image was provided
      html = renderMedicalCertificateHtml({
        patientName: appointment.patientName,
        patientRollNo: appointment.healthCardId,
        doctorName: appointment.doctorName,
        issueDate: new Date().toLocaleDateString(),
        diagnosis,
        restFrom,
        restTo,
        fitFrom,
      });
      appointment.certificateDraftHtml = html;
    }
    
    await appointment.save();

    // Notify staff for verification
    try {
      const staffEmails = await User.find({ role: "staff" }).distinct("email");
      if (staffEmails.length) {
        await sendEmail({
          to: staffEmails,
          subject: generatedCertificateFile 
            ? "Medical Certificate Generated - Verification Required"
            : "Medical Certificate Draft Submitted - Verification Required",
          html: `<p>Dr. ${appointment.doctorName} has ${
            generatedCertificateFile ? "generated and sent" : "submitted a draft for"
          } a medical certificate for ${appointment.patientName}.</p>
                 ${
                   generatedCertificateFile
                     ? `<p>The certificate has been digitally generated and is ready for your review and approval.</p>`
                     : `<p>Please review the draft and issue the certificate.</p>`
                 }
                 <p>Appointment Date: ${new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                 <p>Patient Health Card ID: ${appointment.healthCardId}</p>`,
        });
      }
    } catch (_) {}

    res.json({ 
      message: generatedCertificateFile 
        ? "Medical certificate generated and sent to staff" 
        : "Medical certificate draft submitted",
      ...(html && { html })
    });
  } catch (error) {
    console.error("Submit certificate draft error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ STAFF: ISSUE CERTIFICATE ------------------------ */
exports.staffIssueCertificate = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { certificateFileUrl } = req.body;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    appointment.certificateFile =
      certificateFileUrl || appointment.certificateFile;
    appointment.certificateIssued = true;
    appointment.certificateIssuedAt = new Date();
    await appointment.save();

    // Notify patient
    try {
      if (appointment.patientEmail) {
        await sendEmail({
          to: appointment.patientEmail,
          subject: "Your Medical Certificate is Ready",
          html: `<p>Your medical certificate has been approved.</p>
                 ${
                   appointment.certificateFile
                     ? `<p><a href="${appointment.certificateFile}">Download Certificate</a></p>`
                     : ""
                 }`,
        });
      }
    } catch (_) {}

    res.json({ message: "Medical certificate issued" });
  } catch (error) {
    console.error("Staff issue certificate error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
/* ------------------------ REQUEST MEDICAL CERTIFICATE ------------------------ */
exports.requestCertificate = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if appointment belongs to the user
    if (appointment.patientId.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if appointment is completed
    if (appointment.status !== "completed") {
      return res.status(400).json({
        message:
          "Medical certificate can only be requested for completed appointments",
      });
    }

    // Update certificate request
    appointment.certificateRequested = true;
    appointment.certificateRequestedAt = new Date();
    await appointment.save();

    res.json({
      message: "Medical certificate request submitted successfully",
      appointment,
    });
  } catch (error) {
    console.error("Request certificate error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ VERIFY APPOINTMENT (STAFF) ------------------------ */
exports.verifyAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Verify appointment
    appointment.verifiedByStaff = true;
    appointment.verifiedAt = new Date();
    appointment.verifiedBy = userId;

    // Optionally update status to confirmed if still scheduled
    if (appointment.status === "scheduled") {
      appointment.status = "confirmed";
    }

    await appointment.save();

    res.json({
      message: "Appointment verified successfully",
      appointment,
    });
  } catch (error) {
    console.error("Verify appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------------ UPLOAD PRESCRIPTION (STAFF) ------------------------ */
exports.uploadPrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { prescription, prescriptionFile } = req.body;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Validate prescription data size if provided
    if (prescription && prescription.length > 100000) {
      return res.status(400).json({
        message:
          "Prescription text is too long. Maximum 100,000 characters allowed.",
      });
    }

    // Validate file size if provided (base64 encoded files are ~33% larger)
    if (prescriptionFile) {
      const base64Size = prescriptionFile.length;
      const estimatedOriginalSize = (base64Size * 3) / 4;

      // Check if estimated original size exceeds 10MB
      if (estimatedOriginalSize > 10 * 1024 * 1024) {
        return res.status(400).json({
          message: "File is too large. Maximum file size is 10MB.",
        });
      }
    }

    // Update prescription
    if (prescription !== undefined) {
      appointment.prescription = prescription || "";
    }
    if (prescriptionFile !== undefined) {
      appointment.prescriptionFile = prescriptionFile || "";
    }

    await appointment.save();

    res.json({
      message: "Prescription uploaded successfully",
      appointment: {
        _id: appointment._id,
        prescription: appointment.prescription,
        prescriptionFile: appointment.prescriptionFile ? "File uploaded" : null,
      },
    });
  } catch (error) {
    console.error("Upload prescription error:", error);

    // Handle MongoDB errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error: " + error.message,
      });
    }

    // Handle BSON size errors (MongoDB has a 16MB document limit)
    if (error.message && error.message.includes("BSON")) {
      return res.status(400).json({
        message:
          "File is too large for storage. Please use a smaller file or compress the image.",
      });
    }

    res.status(500).json({
      message: "Server error while uploading prescription",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
