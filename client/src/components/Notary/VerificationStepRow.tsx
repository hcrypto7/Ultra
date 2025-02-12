import React, { useEffect, useState } from "react";
import styled from 'styled-components/macro';
import { Cpu, Check, Circle, Play, Upload } from 'react-feather';
import { CircularProgressbarWithChildren } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import Spinner from "@components/common/Spinner";
import { commonStrings } from "@helpers/strings";
import { NotaryVerificationCircuit } from '@helpers/types';


export const VerificationStepType = {
  UPLOAD: "upload",
  PROVE: "prove",
  SUBMIT: "submit",
};

export const VerificationState = {
  DEFAULT: 'default',
  LOADING: 'loading',
  COMPLETE: 'complete',
};

interface VerificationStepRowProps {
  type: string;
  progress: string;
  circuitType: string;
};

export type VerificationStepRowData = VerificationStepRowProps;

export const VerificationStepRow: React.FC<VerificationStepRowProps> = ({
  type,
  progress,
  circuitType
}: VerificationStepRowProps) => {
  VerificationStepRow.displayName = "VerificationStepRow";

  /*
   * State
   */

  const [progressPercentage, setProgressPercentage] = useState(0);
  const [progressTimer, setProgressTimer] = useState(0);
  

  /*
   * Hooks
   */

  useEffect(() => {
    if (progress === VerificationState.LOADING) {
      const interval = getUpdateIntervalMs();
      const totalTime = getEstimatedTimesMs();
      const steps = totalTime / interval;
      const increment = 100 / steps;

      let timeout: NodeJS.Timeout;
      let currentPercentage = 0;

      const updateProgressCircle = () => {
        if (currentPercentage < 100) {
          setProgressPercentage(currentPercentage);

          const tick = Math.round(increment);
          currentPercentage += tick;

          setProgressTimer(currentPercentage / tick);

          timeout = setTimeout(updateProgressCircle, interval);
        } else {
          setProgressPercentage(100);
        }
      };

      updateProgressCircle();

      return () => clearTimeout(timeout);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  /*
   * Helpers
   */

  const shouldShowProgressCircle = (percentage: number) => {
    return percentage < 100 && type !== VerificationStepType.SUBMIT;
  }

  const getEstimatedTimesMs = () => {
    switch (type) {
      case VerificationStepType.UPLOAD:
        return 1000;
      case VerificationStepType.PROVE:
        return 90000;
      default:
        return 0;
    }
  };

  const getUpdateIntervalMs = () => {
    switch (type) {
      case VerificationStepType.UPLOAD:
        return 10;
      case VerificationStepType.PROVE:
        return 1000;
      default:
        return 0;
    }
  };

  const getLeftIcon = () => {
    switch (type) {
      case VerificationStepType.UPLOAD:
        return <StyledUpload progress={progress} />;
      case VerificationStepType.PROVE:
        return <StyledCpu progress={progress} />;
      case VerificationStepType.SUBMIT:
        return <StyledPlay progress={progress} />;
      default:
        return null;
    }
  };

  const getRightIcon = () => {
    switch (progress) {
      case VerificationState.DEFAULT:
        return <StyledCircle progress={progress} />;

      case VerificationState.LOADING:
        return shouldShowProgressCircle(progressPercentage) ? (
          <CircularProgressbarWithChildren
            maxValue={99}
            styles={{
              root: {
                height: 32,
                width: 32,
              },
              text: {
                fontSize: 32,
                fill: '#4BB543',
              },
              path: {
                stroke: '#4BB543',
                transition: 'none',
              }
            }}
            value={progressPercentage}
          >
            <Percentage>{`${progressTimer}`}</Percentage>
          </CircularProgressbarWithChildren>
        ) : (
          <Spinner size={24} />
        );

      case VerificationState.COMPLETE:
        return <StyledCheck progress={progress} />;

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case VerificationStepType.UPLOAD:
        return commonStrings.get('VERIFICATION_MODAL_UPLOAD_TITLE');

      case VerificationStepType.PROVE:
        switch (circuitType) {
          case NotaryVerificationCircuit.REGISTRATION_TAG:
          case NotaryVerificationCircuit.REGISTRATION_MULTICURRENCY_ID:
            return commonStrings.get('VERIFICATION_MODAL_PROVE_REGISTRATION_TITLE');

          case NotaryVerificationCircuit.TRANSFER:
          default:
            return commonStrings.get('VERIFICATION_MODAL_PROVE_TITLE');
        }

      case VerificationStepType.SUBMIT:
        switch (circuitType) {
          case NotaryVerificationCircuit.REGISTRATION_TAG:
          case NotaryVerificationCircuit.REGISTRATION_MULTICURRENCY_ID:
            return commonStrings.get('VERIFICATION_MODAL_REGISTRATION_SUBMIT_TITLE');

          case NotaryVerificationCircuit.TRANSFER:
          default:
            return commonStrings.get('VERIFICATION_MODAL_SUBMIT_TITLE');
        }

      default:
        return null;
    }
  };

  const getSubTitle = () => {
    switch (type) {
      case VerificationStepType.UPLOAD:
        return commonStrings.get('VERIFICATION_MODAL_UPLOAD_SUBTITLE');

      case VerificationStepType.PROVE:
        switch (circuitType) {
          case NotaryVerificationCircuit.REGISTRATION_TAG:
          case NotaryVerificationCircuit.REGISTRATION_MULTICURRENCY_ID:
            return commonStrings.get('VERIFICATION_MODAL_PROVE_REGISTRATION_SUBTITLE_FAST');

          case NotaryVerificationCircuit.TRANSFER:
          default:
            return commonStrings.get('VERIFICATION_MODAL_PROVE_SUBTITLE_FAST');
        }

      case VerificationStepType.SUBMIT:
        switch (circuitType) {
          case NotaryVerificationCircuit.REGISTRATION_TAG:
          case NotaryVerificationCircuit.REGISTRATION_MULTICURRENCY_ID:
            return commonStrings.get('VERIFICATION_MODAL_REGISTRATION_SUBMIT_SUBTITLE');

          case NotaryVerificationCircuit.TRANSFER:
          default:
            return commonStrings.get('VERIFICATION_MODAL_SUBMIT_SUBTITLE');
        }

      default:
        return null;
    }
  };

  /*
   * Component
   */

  return (
    <Container>
      {getLeftIcon()}

      <TitleAndSubtitleContainer>
        <Label progress={progress}>
          {getTitle()}
        </Label>

        <Subtitle progress={progress}>
          {getSubTitle()}
        </Subtitle>
      </TitleAndSubtitleContainer>

      <ActionsContainer>
        {getRightIcon()}
      </ActionsContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 1rem;
  margin-top: 4px;
  gap: 1.25rem;
`;

const ActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: auto;
`;

const TitleAndSubtitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.span<{ progress: string }>`
  color: ${props => (props.progress === VerificationState.DEFAULT ? '#6C757D' : '#FFFFFF')};
  font-size: 16px;
`;

const Subtitle = styled.span<{ progress: string }>`
  color: ${props => (props.progress === VerificationState.DEFAULT ? '#6C757D' : '#ADB5BD')};
  font-size: 12px;
`;

const IconBase = styled.div<{ progress: string }>`
  width: 24px;
  height: 24px;
  color: ${props => (props.progress === VerificationState.DEFAULT ? '#6C757D' : '#FFFFFF')};
`;

const Percentage = styled.div`
  font-size: 12px;
  color: #4BB543;
  margin-top: 1px;
`;

const StyledCpu = styled(IconBase).attrs({ as: Cpu })``;
const StyledUpload = styled(IconBase).attrs({ as: Upload })``;
const StyledPlay = styled(IconBase).attrs({ as: Play })``;
const StyledCheck = styled(IconBase).attrs({ as: Check })`
  color: ${props => (props.progress === VerificationState.DEFAULT ? '#6C757D' : '#4BB543')};
`;
const StyledCircle = styled(IconBase).attrs({ as: Circle })``;
