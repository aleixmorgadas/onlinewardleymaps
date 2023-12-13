import React from 'react';
import PositionCalculator from './PositionCalculator';
import Movable from './Movable';
import DefaultPositionUpdater from './positionUpdaters/DefaultPositionUpdater';
import { ExistingMaturityMatcher } from './positionUpdaters/ExistingMaturityMatcher';
import { NotDefinedMaturityMatcher } from './positionUpdaters/NotDefinedMaturityMatcher';
import PipelineBoxSymbol from '../symbols/PipelineBoxSymbol';
import ComponentSymbol from '../symbols/ComponentSymbol';
import ComponentText from './ComponentText';
import { useModKeyPressedConsumer } from '../KeyPressContext';

function PipelineVersion2(props) {
	const positionCalc = new PositionCalculator();
	const isModKeyPressed = useModKeyPressedConsumer();

	const noLabelMatcher = {
		matcher: (line, identifier, type) => {
			return (
				ExistingMaturityMatcher.matcher(line, identifier, type) &&
				!ExistingMaturityMatcher.matcher(line, '', 'label')
			);
		},
		action: (line, moved) => {
			return ExistingMaturityMatcher.action(line, moved);
		},
	};

	const withLabelMatcher = {
		matcher: (line, identifier, type) => {
			return (
				ExistingMaturityMatcher.matcher(line, identifier, type) &&
				ExistingMaturityMatcher.matcher(line, '', 'label')
			);
		},
		action: (line, moved) => {
			const parts = line.split('label');
			const newPart = ExistingMaturityMatcher.action(parts[0], moved);
			return newPart + 'label' + parts[1];
		},
	};

	const positionUpdater = new DefaultPositionUpdater(
		'pipelinecomponent',
		props.mapText,
		props.mutateMapText,
		[noLabelMatcher, withLabelMatcher, NotDefinedMaturityMatcher]
	);

	function endDragForLabel(pipelineComponent, moved) {
		props.mutateMapText(
			props.mapText
				.split('\n')
				.map(line => {
					{
						if (
							line
								.replace(/\s/g, '')
								.indexOf(
									'pipelinecomponent' +
										pipelineComponent.name.replace(/\s/g, '') +
										'['
								) === 0
						) {
							if (line.replace(/\s/g, '').indexOf('label[') > -1) {
								return line.replace(
									/\slabel\s\[(.?|.+?)\]+/g,
									` label [${parseFloat(moved.x).toFixed(2)}, ${parseFloat(
										moved.y
									).toFixed(2)}]`
								);
							} else {
								return (
									line.trim() +
									` label [${parseFloat(moved.x).toFixed(2)}, ${parseFloat(
										moved.y
									).toFixed(2)}]`
								);
							}
						} else {
							return line;
						}
					}
				})
				.join('\n')
		);
	}

	function endDragX2(component, moved) {
		positionUpdater.update(
			{
				param1: positionCalc.xToMaturity(moved.x, props.mapDimensions.width),
			},
			component.name
		);
	}
	const x1 = positionCalc.maturityToX(
		props.pipeline.maturity1,
		props.mapDimensions.width
	);
	const x2 = positionCalc.maturityToX(
		props.pipeline.maturity2,
		props.mapDimensions.width
	);

	const xCalc = mat => positionCalc.maturityToX(mat, props.mapDimensions.width);

	const y =
		positionCalc.visibilityToY(
			props.pipeline.visibility,
			props.mapDimensions.height
		) + 2;

	return (
		<>
			<PipelineBoxSymbol
				id={'pipeline_box_' + props.pipeline.id}
				y={y}
				x1={x1 - 10}
				x2={x2 + 10}
				styles={props.mapStyleDefs.component}
			/>
			{props.pipeline.components.map((component, i) => (
				<>
					<Movable
						id={'pipeline_' + props.pipeline.id + '_' + i}
						onMove={m => endDragX2(component, m)}
						x={xCalc(component.maturity)}
						y={y + 12}
						fixedY={true}
						fixedX={false}
						isModKeyPressed={isModKeyPressed}
					>
						<ComponentSymbol
							id={'pipeline_circle_' + props.pipeline.id + '_' + i}
							cx={'0'}
							cy="0"
							styles={props.mapStyleDefs.component}
							onClick={() => props.setHighlightLine(props.pipeline.line)}
						/>
					</Movable>
					<g
						transform={'translate(' + xCalc(component.maturity) + ',' + y + ')'}
					>
						<ComponentText
							overrideDrag={m => endDragForLabel(component, m)}
							id={'pipelinecomponent_text_' + component.id}
							mapStyleDefs={props.mapStyleDefs}
							element={component}
							mapText={props.mapText}
							mutateMapText={props.mutateMapText}
							// onClick={onElementClick}
						/>
					</g>
				</>
			))}
		</>
	);
}

export default PipelineVersion2;
