import React from "react";
import styled, { css } from 'styled-components/macro'

import { SVGIconThemed } from '../SVGIcon/SVGIconThemed';


interface IntentRowProps {
  address: string;
  amount: string;
  timestamp: string;
  rowIndex: number;
}

export const IntentRow: React.FC<IntentRowProps> = ({
  address,
  amount,
  timestamp,
  rowIndex,
}: IntentRowProps) => {
  IntentRow.displayName = "IntentRow";

  const depositAmountLabel = `${amount} USDC`;
  const timeRemainingLabel = `Time Remaining: ${timestamp}`;

  return (
    <Container>
      <AddressContainer>
        <SVGIconThemed icon={'usdc'} width={'24'} height={'24'}/>
        <AmountLabelsContainer>
          <AmountLabel> {depositAmountLabel} </AmountLabel>
          <AmountLabel> {timeRemainingLabel} </AmountLabel>
        </AmountLabelsContainer>
      </AddressContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1.25rem 1.5rem;

  &:focus-within {
    border-color: #CED4DA;
    border-width: 1px;
  }
`;

const AddressContainer = styled.div`
  width: 100%; 
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.25rem;
  line-height: 24px;
`;

const AmountLabelsContainer = styled.div`
  width: 100%; 
  display: flex;
  gap: 2px;
  flex-direction: column;
  line-height: 24px;
`;

const AmountLabel = styled.label`
  display: flex;
  font-size: 15px;
  color: #FFFFFF;
  align-items: center;
`;