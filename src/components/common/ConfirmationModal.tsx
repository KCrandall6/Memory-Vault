import { Button, Modal } from 'react-bootstrap';

type ConfirmationModalProps = {
  show: boolean;
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel?: string;
  destructive?: boolean;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const ConfirmationModal = ({
  show,
  title,
  message,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  destructive = false,
  confirming = false,
  onCancel,
  onConfirm,
}: ConfirmationModalProps) => (
  <Modal show={show} onHide={onCancel} centered>
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p className="mb-0 text-muted">{message}</p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onCancel} disabled={confirming}>
        {cancelLabel}
      </Button>
      <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} disabled={confirming}>
        {confirming ? 'Working…' : confirmLabel}
      </Button>
    </Modal.Footer>
  </Modal>
);

export default ConfirmationModal;
